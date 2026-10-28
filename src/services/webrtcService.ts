/**
 * WebRTC Peer-to-Peer Data Channel Sync Service
 * 
 * Enables browser-to-browser direct real-time task synchronization
 * across multiple devices without relying on a central database like Firebase.
 */

import { Task, P2PConnectionState, P2PSyncStats } from '../types';

export interface P2PMessage {
  type: 'SYNC_INIT' | 'SYNC_ACK' | 'TASK_MUTATION' | 'FULL_SYNC' | 'PING' | 'PONG';
  senderPeerId: string;
  timestamp: number;
  tasks?: Task[];
  task?: Task;
  taskId?: string;
  action?: 'add' | 'update' | 'delete' | 'toggle' | 'bulk';
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export class WebRTCService {
  private peerId: string;
  private roomId: string;
  private peerConnections = new Map<string, RTCPeerConnection>();
  private dataChannels = new Map<string, RTCDataChannel>();
  private ws: WebSocket | null = null;
  private connectionState: P2PConnectionState = 'disconnected';
  private pingInterval: number | null = null;
  private lastPingSent = 0;
  private pingMs: number | undefined;
  private messagesSent = 0;
  private messagesReceived = 0;

  // Listeners
  private onTasksUpdateCallback?: (tasks: Task[], action?: string) => void;
  private onStatsChangeCallback?: (stats: P2PSyncStats) => void;
  private getLocalTasksCallback?: () => Task[];

  constructor() {
    this.peerId = 'peer_' + Math.random().toString(36).substring(2, 9);
    // Default room from URL query param or localStorage or default
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const roomParam = urlParams?.get('room') || urlParams?.get('pair');
    this.roomId = roomParam || (typeof localStorage !== 'undefined' ? localStorage.getItem('taskpulse_p2p_room') : null) || 'taskpulse-main-room';
  }

  public getPeerId(): string {
    return this.peerId;
  }

  public getRoomId(): string {
    return this.roomId;
  }

  public setRoomId(roomId: string) {
    if (this.roomId !== roomId) {
      this.disconnect();
      this.roomId = roomId;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('taskpulse_p2p_room', roomId);
      }
      this.connect();
    }
  }

  public registerCallbacks(
    onTasksUpdate: (tasks: Task[], action?: string) => void,
    onStatsChange: (stats: P2PSyncStats) => void,
    getLocalTasks: () => Task[]
  ) {
    this.onTasksUpdateCallback = onTasksUpdate;
    this.onStatsChangeCallback = onStatsChange;
    this.getLocalTasksCallback = getLocalTasks;
    this.notifyStats();
  }

  public connect() {
    if (typeof window === 'undefined') return;
    this.updateState('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/webrtc-signal`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Send join room message
        this.ws?.send(
          JSON.stringify({
            type: 'join',
            roomId: this.roomId,
            peerId: this.peerId,
          })
        );
      };

      this.ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          await this.handleSignalingMessage(msg);
        } catch (e) {
          console.warn('Signaling parse error:', e);
        }
      };

      this.ws.onclose = () => {
        if (this.connectionState !== 'connected') {
          this.updateState('disconnected');
        }
        // Auto reconnect signaling after delay
        setTimeout(() => {
          if (this.connectionState === 'disconnected' || this.connectionState === 'reconnecting') {
            this.connect();
          }
        }, 3000);
      };

      this.ws.onerror = () => {
        this.updateState('disconnected');
      };
    } catch (e) {
      console.warn('WebSocket connection error:', e);
      this.updateState('disconnected');
    }

    this.startPingMonitor();
  }

  public disconnect() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.dataChannels.forEach((dc) => dc.close());
    this.dataChannels.clear();
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.updateState('disconnected');
  }

  private async handleSignalingMessage(msg: any) {
    const { type, peerId: remotePeerId, isInitiator, fromPeerId, data } = msg;

    if (type === 'peer_joined') {
      // Create or setup RTCPeerConnection for this remote peer
      if (isInitiator) {
        await this.createPeerConnection(remotePeerId, true);
      }
    } else if (type === 'signal') {
      const senderId = fromPeerId;
      let pc = this.peerConnections.get(senderId);
      if (!pc) {
        pc = await this.createPeerConnection(senderId, false);
      }

      if (data.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.sendSignal(senderId, pc.localDescription);
      } else if (data.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
      } else if (data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.warn('ICE candidate error:', e);
        }
      }
    } else if (type === 'peer_left') {
      this.removePeer(remotePeerId);
    }
  }

  private async createPeerConnection(remotePeerId: string, isInitiator: boolean): Promise<RTCPeerConnection> {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnections.set(remotePeerId, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(remotePeerId, { candidate: event.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        this.updateState('connected');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.removePeer(remotePeerId);
      }
    };

    if (isInitiator) {
      // Create data channel
      const dc = pc.createDataChannel('taskpulse-p2p', { ordered: true });
      this.setupDataChannel(remotePeerId, dc);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.sendSignal(remotePeerId, pc.localDescription);
    } else {
      pc.ondatachannel = (event) => {
        this.setupDataChannel(remotePeerId, event.channel);
      };
    }

    return pc;
  }

  private setupDataChannel(remotePeerId: string, dc: RTCDataChannel) {
    this.dataChannels.set(remotePeerId, dc);

    dc.onopen = () => {
      this.updateState('connected');
      // Direct P2P Handshake: Send local tasks to peer for initial merge
      const localTasks = this.getLocalTasksCallback ? this.getLocalTasksCallback() : [];
      this.sendMessage(dc, {
        type: 'SYNC_INIT',
        senderPeerId: this.peerId,
        timestamp: Date.now(),
        tasks: localTasks,
      });
    };

    dc.onmessage = (event) => {
      this.messagesReceived++;
      try {
        const msg: P2PMessage = JSON.parse(event.data);
        this.handlePeerMessage(remotePeerId, msg, dc);
      } catch (e) {
        console.warn('P2P message parse warning:', e);
      }
      this.notifyStats();
    };

    dc.onclose = () => {
      this.dataChannels.delete(remotePeerId);
      if (this.dataChannels.size === 0) {
        this.updateState('connecting');
      }
      this.notifyStats();
    };
  }

  private handlePeerMessage(remotePeerId: string, msg: P2PMessage, dc: RTCDataChannel) {
    const localTasks = this.getLocalTasksCallback ? this.getLocalTasksCallback() : [];

    if (msg.type === 'SYNC_INIT') {
      // Reconcile and merge tasks using Last-Write-Wins (LWW)
      const merged = this.reconcileTasks(localTasks, msg.tasks || []);
      if (this.onTasksUpdateCallback) {
        this.onTasksUpdateCallback(merged, 'p2p_initial_merge');
      }
      // Send back acknowledgment with reconciled state
      this.sendMessage(dc, {
        type: 'SYNC_ACK',
        senderPeerId: this.peerId,
        timestamp: Date.now(),
        tasks: merged,
      });
    } else if (msg.type === 'SYNC_ACK') {
      if (Array.isArray(msg.tasks) && this.onTasksUpdateCallback) {
        const merged = this.reconcileTasks(localTasks, msg.tasks);
        this.onTasksUpdateCallback(merged, 'p2p_synced');
      }
    } else if (msg.type === 'TASK_MUTATION') {
      if (this.onTasksUpdateCallback) {
        if (msg.action === 'delete' && msg.taskId) {
          const filtered = localTasks.filter((t) => t.id !== msg.taskId);
          this.onTasksUpdateCallback(filtered, 'p2p_delete');
        } else if (msg.task) {
          const idx = localTasks.findIndex((t) => t.id === msg.task!.id);
          let updated: Task[];
          if (idx >= 0) {
            updated = [...localTasks];
            updated[idx] = msg.task;
          } else {
            updated = [msg.task, ...localTasks];
          }
          this.onTasksUpdateCallback(updated, `p2p_${msg.action || 'update'}`);
        } else if (msg.tasks) {
          this.onTasksUpdateCallback(msg.tasks, 'p2p_bulk');
        }
      }
    } else if (msg.type === 'FULL_SYNC' && msg.tasks) {
      if (this.onTasksUpdateCallback) {
        const merged = this.reconcileTasks(localTasks, msg.tasks);
        this.onTasksUpdateCallback(merged, 'p2p_full_sync');
      }
    } else if (msg.type === 'PING') {
      this.sendMessage(dc, {
        type: 'PONG',
        senderPeerId: this.peerId,
        timestamp: msg.timestamp,
      });
    } else if (msg.type === 'PONG') {
      if (msg.timestamp) {
        this.pingMs = Math.round(Date.now() - msg.timestamp);
        this.notifyStats();
      }
    }
  }

  /**
   * Last-Write-Wins (LWW) state reconciliation algorithm
   */
  private reconcileTasks(local: Task[], remote: Task[]): Task[] {
    const map = new Map<string, Task>();

    for (const t of local) {
      map.set(t.id, t);
    }

    for (const r of remote) {
      if (!map.has(r.id)) {
        map.set(r.id, r);
      } else {
        const existing = map.get(r.id)!;
        const localTime = new Date(existing.updatedAt || existing.createdAt).getTime();
        const remoteTime = new Date(r.updatedAt || r.createdAt).getTime();
        if (remoteTime > localTime) {
          map.set(r.id, r);
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }

  /**
   * Broadcast task mutation directly to all connected WebRTC peers
   */
  public broadcastMutation(action: 'add' | 'update' | 'delete' | 'toggle' | 'bulk', task?: Task, allTasks?: Task[], taskId?: string) {
    const msg: P2PMessage = {
      type: 'TASK_MUTATION',
      action,
      task,
      tasks: allTasks,
      taskId,
      senderPeerId: this.peerId,
      timestamp: Date.now(),
    };

    this.dataChannels.forEach((dc) => {
      this.sendMessage(dc, msg);
    });
  }

  /**
   * Request an immediate full sync across all connected peers
   */
  public triggerFullSync(tasks: Task[]) {
    const msg: P2PMessage = {
      type: 'FULL_SYNC',
      tasks,
      senderPeerId: this.peerId,
      timestamp: Date.now(),
    };
    this.dataChannels.forEach((dc) => {
      this.sendMessage(dc, msg);
    });
  }

  private sendMessage(dc: RTCDataChannel, msg: P2PMessage) {
    if (dc.readyState === 'open') {
      try {
        dc.send(JSON.stringify(msg));
        this.messagesSent++;
        this.notifyStats();
      } catch (e) {
        console.warn('DataChannel send error:', e);
      }
    }
  }

  private sendSignal(targetPeerId: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'signal',
          targetPeerId,
          fromPeerId: this.peerId,
          data,
        })
      );
    }
  }

  private removePeer(remotePeerId: string) {
    const dc = this.dataChannels.get(remotePeerId);
    if (dc) {
      dc.close();
      this.dataChannels.delete(remotePeerId);
    }
    const pc = this.peerConnections.get(remotePeerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(remotePeerId);
    }
    if (this.dataChannels.size === 0) {
      this.updateState('connecting');
    }
    this.notifyStats();
  }

  private startPingMonitor() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = window.setInterval(() => {
      if (this.dataChannels.size > 0) {
        this.lastPingSent = Date.now();
        this.dataChannels.forEach((dc) => {
          this.sendMessage(dc, {
            type: 'PING',
            senderPeerId: this.peerId,
            timestamp: this.lastPingSent,
          });
        });
      }
    }, 5000);
  }

  private updateState(newState: P2PConnectionState) {
    this.connectionState = newState;
    this.notifyStats();
  }

  private notifyStats() {
    if (this.onStatsChangeCallback) {
      const firstChannel = Array.from(this.dataChannels.values())[0];
      this.onStatsChangeCallback({
        state: this.dataChannels.size > 0 ? 'connected' : this.connectionState,
        roomId: this.roomId,
        peerId: this.peerId,
        connectedPeersCount: this.dataChannels.size,
        pingMs: this.pingMs,
        messagesSent: this.messagesSent,
        messagesReceived: this.messagesReceived,
        channelReadyState: firstChannel?.readyState,
      });
    }
  }
}

// Singleton instance
export const p2pService = new WebRTCService();
