/**
 * WorkAdventure-style Jitsi integration service for self-metaverse
 * Real-time peer-to-peer video calling with WebRTC
 */

export interface JitsiParticipant {
  userId: string;
  displayName: string;
  isInitiator: boolean;
  micEnabled: boolean;
  cameraEnabled: boolean;
  stream?: MediaStream;
  peerConnection?: RTCPeerConnection;
}

export interface JoinRequest {
  userId: string;
  displayName: string;
  timestamp: number;
}

export class WorkAdventureVideoService {
  private localStream: MediaStream | null = null;
  private active = false;
  private micEnabled = true;
  private cameraEnabled = true;
  private participants: Map<string, JitsiParticipant> = new Map();
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private initiatorId: string | null = null;
  private currentUserId: string | null = null;
  private currentDisplayName: string | null = null;
  private roomName: string | null = null;
  private pendingJoinRequests: Map<string, JoinRequest> = new Map();

  // Callback functions
  private onSendSignal?: (type: string, payload: any) => void;
  private onParticipantsUpdate?: () => void;
  private onJoinRequest?: (request: JoinRequest) => void;
  private onKickNotification?: (kickedBy: string) => void;

  // ICE servers configuration (similar to WorkAdventure)
  private readonly iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  constructor(
    onSendSignal?: (type: string, payload: any) => void,
    onParticipantsUpdate?: () => void,
    onJoinRequest?: (request: JoinRequest) => void,
    onKickNotification?: (kickedBy: string) => void
  ) {
    this.onSendSignal = onSendSignal;
    this.onParticipantsUpdate = onParticipantsUpdate;
    this.onJoinRequest = onJoinRequest;
    this.onKickNotification = onKickNotification;
  }

  /**
   * Request permissions for microphone and camera
   * Similar to WorkAdventure's permission flow
   */
  public async requestPermissions(
    audio: boolean = true,
    video: boolean = true
  ): Promise<{ audio: boolean; video: boolean }> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio,
        video: video
          ? {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user',
            }
          : false,
      });

      // Store permissions state
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();

      // Stop the test stream
      stream.getTracks().forEach((track) => track.stop());

      return {
        audio: audioTracks.length > 0,
        video: videoTracks.length > 0,
      };
    } catch (error) {
      console.warn('Permission request failed:', error);
      return { audio: false, video: false };
    }
  }

  /**
   * Join a video call room
   */
  public async joinRoom(
    roomName: string,
    userId: string,
    displayName: string,
    requestToJoin: boolean = false
  ): Promise<void> {
    try {
      console.log(`[WorkAdventureVideo] Requesting to join room: ${roomName}`);

      this.roomName = roomName;
      this.currentUserId = userId;
      this.currentDisplayName = displayName;

      // If this is not the first user, send join request
      if (requestToJoin) {
        this.sendSignal('video-join-request', {
          roomName,
          userId,
          displayName,
          timestamp: Date.now(),
        });
        return;
      }

      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: this.micEnabled,
        video: this.cameraEnabled
          ? {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user',
            }
          : false,
      });

      this.active = true;

      // If no participants exist, become initiator
      if (this.participants.size === 0) {
        this.initiatorId = userId;
        console.log(`[WorkAdventureVideo] ${userId} is now the call initiator`);
      }

      // Add self to participants
      this.participants.set(userId, {
        userId,
        displayName,
        isInitiator: this.initiatorId === userId,
        micEnabled: this.micEnabled,
        cameraEnabled: this.cameraEnabled,
        stream: this.localStream,
      });

      // Notify server of join
      this.sendSignal('video-join', {
        roomName,
        userId,
        displayName,
        micEnabled: this.micEnabled,
        cameraEnabled: this.cameraEnabled,
        isInitiator: this.initiatorId === userId,
      });

      this.notifyParticipantsUpdate();
    } catch (error) {
      console.error('[WorkAdventureVideo] Failed to join room:', error);
      throw error;
    }
  }

  /**
   * Handle join request (for initiator)
   */
  public acceptJoinRequest(userId: string): void {
    const request = this.pendingJoinRequests.get(userId);
    if (!request) return;

    this.sendSignal('video-join-accepted', {
      roomName: this.roomName,
      userId: request.userId,
      acceptedBy: this.currentUserId,
    });

    this.pendingJoinRequests.delete(userId);
  }

  /**
   * Decline join request (for initiator)
   */
  public declineJoinRequest(userId: string): void {
    const request = this.pendingJoinRequests.get(userId);
    if (!request) return;

    this.sendSignal('video-join-declined', {
      roomName: this.roomName,
      userId: request.userId,
      declinedBy: this.currentUserId,
    });

    this.pendingJoinRequests.delete(userId);
  }

  /**
   * Handle incoming join request
   * Only show the modal to the initiator, not to other participants
   */
  public handleJoinRequest(payload: any): void {
    const { userId, displayName, timestamp } = payload;

    const request: JoinRequest = {
      userId,
      displayName,
      timestamp,
    };

    this.pendingJoinRequests.set(userId, request);

    // Only show the join request modal to the initiator
    if (this.onJoinRequest && this.currentUserId === this.initiatorId) {
      this.onJoinRequest(request);
    }
  }

  /**
   * Handle join acceptance
   */
  public async handleJoinAccepted(payload: any): Promise<void> {
    const { userId, acceptedBy } = payload;

    if (userId === this.currentUserId && this.currentUserId) {
      console.log(
        `[WorkAdventureVideo] Join request accepted by ${acceptedBy}`
      );

      // We were accepted, now get user media and establish local stream
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: this.micEnabled,
          video: this.cameraEnabled
            ? {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user',
              }
            : false,
        });

        this.active = true;

        // Add self to participants using the provided display name
        this.participants.set(this.currentUserId, {
          userId: this.currentUserId,
          displayName: this.currentDisplayName || `User ${this.currentUserId}`,
          isInitiator: false,
          micEnabled: this.micEnabled,
          cameraEnabled: this.cameraEnabled,
          stream: this.localStream,
        });

        // Notify server that we've joined
        this.sendSignal('video-join', {
          roomName: this.roomName,
          userId: this.currentUserId,
          displayName: this.currentDisplayName || `User ${this.currentUserId}`,
          micEnabled: this.micEnabled,
          cameraEnabled: this.cameraEnabled,
          isInitiator: false,
        });

        this.notifyParticipantsUpdate();

        console.log(
          `[WorkAdventureVideo] Successfully joined call with ${this.participants.size} participants`
        );
      } catch (error) {
        console.error(
          '[WorkAdventureVideo] Failed to get user media after acceptance:',
          error
        );
      }
    }
  }

  /**
   * Handle join decline
   */
  public handleJoinDeclined(payload: any): void {
    const { userId } = payload;

    if (userId === this.currentUserId) {
      console.log('[WorkAdventureVideo] Join request was declined');
      // Could show notification to user
    }
  }

  /**
   * Handle participant joining
   */
  public async handleParticipantJoin(payload: any): Promise<void> {
    const { userId, displayName, micEnabled, cameraEnabled, isInitiator } =
      payload;

    if (userId === this.currentUserId) return; // Don't add ourselves

    console.log(
      `[WorkAdventureVideo] Participant ${displayName} (${userId}) joining call`
    );

    // Create peer connection for new participant
    const peerConnection = this.createPeerConnection(userId);

    const participant: JitsiParticipant = {
      userId,
      displayName,
      isInitiator,
      micEnabled,
      cameraEnabled,
      peerConnection,
    };

    this.participants.set(userId, participant);

    // If we have a local stream, add it to the peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        console.log(
          `[WebRTC] Adding local track to peer connection for ${userId}`
        );
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    // IMPORTANT: Only the INITIATOR creates offers to ALL new participants
    // This prevents both users from creating offers simultaneously
    const shouldCreateOffer = this.currentUserId && Number(this.currentUserId);

    if (shouldCreateOffer) {
      console.log(
        `[WebRTC] Creating offer for ${userId} (I am initiator: ${this.initiatorId})`
      );
      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        this.sendSignal('video-offer', {
          targetUserId: userId,
          fromUserId: this.currentUserId,
          offer: offer,
        });
      } catch (error) {
        console.error(`[WebRTC] Failed to create offer for ${userId}:`, error);
      }
    } else {
      console.log(
        `[WebRTC] Not creating offer for ${userId} (I am not initiator, initiator is: ${this.initiatorId})`
      );
    }

    this.notifyParticipantsUpdate();
  }

  /**
   * Handle WebRTC offer
   */
  public async handleOffer(payload: any): Promise<void> {
    const { fromUserId, offer } = payload;

    console.log(`[WebRTC] Received offer from ${fromUserId}`);

    let participant = this.participants.get(fromUserId);

    // If participant doesn't exist, create one (this can happen if they joined first)
    if (!participant) {
      const peerConnection = this.createPeerConnection(fromUserId);
      participant = {
        userId: fromUserId,
        displayName: `User ${fromUserId}`,
        isInitiator: false,
        micEnabled: true,
        cameraEnabled: true,
        peerConnection,
      };
      this.participants.set(fromUserId, participant);
    }

    if (!participant?.peerConnection) {
      console.error(`[WebRTC] No peer connection for ${fromUserId}`);
      return;
    }

    try {
      // Add local stream to peer connection if we have one
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          if (participant?.peerConnection) {
            participant.peerConnection.addTrack(track, this.localStream!);
          }
        });
      }

      await participant.peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const answer = await participant.peerConnection.createAnswer();
      await participant.peerConnection.setLocalDescription(answer);

      console.log(`[WebRTC] Sending answer to ${fromUserId}`);
      this.sendSignal('video-answer', {
        targetUserId: fromUserId,
        fromUserId: this.currentUserId,
        answer: answer,
      });

      this.notifyParticipantsUpdate();
    } catch (error) {
      console.error(
        `[WebRTC] Failed to handle offer from ${fromUserId}:`,
        error
      );
    }
  }

  /**
   * Handle WebRTC answer
   */
  public async handleAnswer(payload: any): Promise<void> {
    const { fromUserId, answer } = payload;

    console.log(`[WebRTC] Received answer from ${fromUserId}`);

    const participant = this.participants.get(fromUserId);

    if (!participant?.peerConnection) {
      console.error(
        `[WebRTC] No peer connection for answer from ${fromUserId}`
      );
      return;
    }

    try {
      await participant.peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
      console.log(`[WebRTC] Set remote description from ${fromUserId} answer`);
    } catch (error) {
      console.error(
        `[WebRTC] Failed to handle answer from ${fromUserId}:`,
        error
      );
    }
  }

  /**
   * Handle ICE candidate
   */
  public async handleIceCandidate(payload: any): Promise<void> {
    const { fromUserId, candidate } = payload;

    console.log(`[WebRTC] Received ICE candidate from ${fromUserId}`);

    const participant = this.participants.get(fromUserId);

    if (!participant?.peerConnection) {
      console.error(
        `[WebRTC] No peer connection for ICE candidate from ${fromUserId}`
      );
      return;
    }

    try {
      await participant.peerConnection.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
      console.log(`[WebRTC] Added ICE candidate from ${fromUserId}`);
    } catch (error) {
      console.error(
        `[WebRTC] Failed to add ICE candidate from ${fromUserId}:`,
        error
      );
    }
  }

  /**
   * Handle participant leaving
   */
  public handleParticipantLeave(payload: any): void {
    const { userId } = payload;

    const participant = this.participants.get(userId);
    if (participant?.peerConnection) {
      participant.peerConnection.close();
    }

    this.participants.delete(userId);
    this.notifyParticipantsUpdate();
  }

  /**
   * Handle media state changes
   */
  public handleMediaStateChange(payload: any): void {
    const { userId, micEnabled, cameraEnabled } = payload;

    const participant = this.participants.get(userId);
    if (participant) {
      participant.micEnabled = micEnabled;
      participant.cameraEnabled = cameraEnabled;
      this.notifyParticipantsUpdate();
    }
  }

  /**
   * Handle kick event
   */
  public handleKick(payload: any): void {
    const { targetUserId, kickedBy } = payload;

    console.log(
      `[WorkAdventureVideo] Handling kick - targetUserId: ${targetUserId}, kickedBy: ${kickedBy}, currentUserId: ${this.currentUserId}`
    );

    if (targetUserId === this.currentUserId) {
      // We were kicked
      console.log(
        `[WorkAdventureVideo] I was kicked by ${kickedBy}! Leaving room...`
      );
      this.leaveRoom();
      if (this.onKickNotification) {
        this.onKickNotification(kickedBy);
      }
    } else {
      // Someone else was kicked
      console.log(
        `[WorkAdventureVideo] Someone else (${targetUserId}) was kicked by ${kickedBy}`
      );
      this.handleParticipantLeave({ userId: targetUserId });
    }
  }

  /**
   * Kick a participant (initiator only)
   */
  public kickParticipant(participantId: string): void {
    if (this.initiatorId !== this.currentUserId) {
      console.warn('[WorkAdventureVideo] Only initiator can kick participants');
      return;
    }

    this.sendSignal('video-kick', {
      roomName: this.roomName,
      targetUserId: participantId,
      kickedBy: this.currentUserId,
    });

    // Remove from local participants
    this.handleParticipantLeave({ userId: participantId });
  }

  /**
   * Toggle microphone
   */
  public toggleMicrophone(): void {
    this.micEnabled = !this.micEnabled;

    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = this.micEnabled;
      });
    }

    // Update local participant
    const self = this.participants.get(this.currentUserId!);
    if (self) {
      self.micEnabled = this.micEnabled;
    }

    // Notify others
    this.sendSignal('video-media-state', {
      roomName: this.roomName,
      userId: this.currentUserId,
      micEnabled: this.micEnabled,
      cameraEnabled: this.cameraEnabled,
    });

    this.notifyParticipantsUpdate();
  }

  /**
   * Toggle camera
   */
  public async toggleCamera(): Promise<void> {
    this.cameraEnabled = !this.cameraEnabled;

    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = this.cameraEnabled;
      });
    }

    // Update local participant
    const self = this.participants.get(this.currentUserId!);
    if (self) {
      self.cameraEnabled = this.cameraEnabled;
    }

    // Notify others
    this.sendSignal('video-media-state', {
      roomName: this.roomName,
      userId: this.currentUserId,
      micEnabled: this.micEnabled,
      cameraEnabled: this.cameraEnabled,
    });

    this.notifyParticipantsUpdate();
  }

  /**
   * Leave the call
   */
  public leaveRoom(): void {
    console.log('[WorkAdventureVideo] Leaving room');

    // Close all peer connections
    this.peerConnections.forEach((_, userId) => {
      this.cleanupPeerConnection(userId);
    });

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Notify server
    if (this.active) {
      this.sendSignal('video-leave', {
        roomName: this.roomName,
        userId: this.currentUserId,
      });
    }

    // Reset state
    this.participants.clear();
    this.peerConnections.clear();
    this.pendingJoinRequests.clear();
    this.active = false;
    this.initiatorId = null;
    this.currentUserId = null;
    this.roomName = null;

    this.notifyParticipantsUpdate();
  }

  /**
   * Create WebRTC peer connection
   */
  private createPeerConnection(userId: string): RTCPeerConnection {
    const peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers,
    });

    // Store peer connection for management
    this.peerConnections.set(userId, peerConnection);

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal('video-ice-candidate', {
          targetUserId: userId,
          fromUserId: this.currentUserId,
          candidate: event.candidate,
        });
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log(`[WebRTC] Received remote stream from ${userId}`);
      const participant = this.participants.get(userId);
      if (participant) {
        participant.stream = event.streams[0];
        this.notifyParticipantsUpdate();
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(
        `[WebRTC] Connection state with ${userId}: ${peerConnection.connectionState}`
      );
      if (
        peerConnection.connectionState === 'disconnected' ||
        peerConnection.connectionState === 'failed'
      ) {
        this.cleanupPeerConnection(userId);
      }
    };

    return peerConnection;
  }

  /**
   * Clean up peer connection
   */
  private cleanupPeerConnection(userId: string): void {
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(userId);
    }

    const participant = this.participants.get(userId);
    if (participant?.stream) {
      participant.stream.getTracks().forEach((track) => track.stop());
    }
  }

  /**
   * Send signaling message
   */
  private sendSignal(type: string, payload: any): void {
    if (this.onSendSignal) {
      this.onSendSignal(type, payload);
    }
  }

  /**
   * Notify UI of participants update
   */
  private notifyParticipantsUpdate(): void {
    if (this.onParticipantsUpdate) {
      this.onParticipantsUpdate();
    }
  }

  // Getters
  public getParticipants(): JitsiParticipant[] {
    return Array.from(this.participants.values());
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public isActive(): boolean {
    return this.active;
  }

  public isMicEnabled(): boolean {
    return this.micEnabled;
  }

  public isCameraEnabled(): boolean {
    return this.cameraEnabled;
  }

  public getInitiatorId(): string | null {
    return this.initiatorId;
  }

  public getPendingJoinRequests(): JoinRequest[] {
    return Array.from(this.pendingJoinRequests.values());
  }
}
