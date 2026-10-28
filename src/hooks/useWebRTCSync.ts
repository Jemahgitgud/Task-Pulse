import { useState, useEffect, useRef } from 'react';
import { p2pService } from '../services/webrtcService';
import { Task, P2PSyncStats } from '../types';

export function useWebRTCSync(
  tasks: Task[],
  onRemoteTasksUpdate: (newTasks: Task[]) => void
) {
  const [stats, setStats] = useState<P2PSyncStats>({
    state: 'connecting',
    roomId: p2pService.getRoomId(),
    peerId: p2pService.getPeerId(),
    connectedPeersCount: 0,
    messagesSent: 0,
    messagesReceived: 0,
  });

  const tasksRef = useRef<Task[]>(tasks);
  tasksRef.current = tasks;

  useEffect(() => {
    p2pService.registerCallbacks(
      (updatedTasks) => {
        onRemoteTasksUpdate(updatedTasks);
      },
      (newStats) => {
        setStats(newStats);
      },
      () => tasksRef.current
    );

    p2pService.connect();

    return () => {
      // Don't fully disconnect on re-renders, service is singleton
    };
  }, []);

  const changeRoom = (newRoom: string) => {
    p2pService.setRoomId(newRoom);
  };

  const broadcastMutation = (
    action: 'add' | 'update' | 'delete' | 'toggle' | 'bulk',
    task?: Task,
    allTasks?: Task[],
    taskId?: string
  ) => {
    p2pService.broadcastMutation(action, task, allTasks, taskId);
  };

  const syncNow = () => {
    p2pService.triggerFullSync(tasksRef.current);
  };

  return {
    p2pStats: stats,
    changeRoom,
    broadcastMutation,
    syncNow,
  };
}
