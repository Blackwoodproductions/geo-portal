import { Prisma } from '@prisma/client';

export const OWNER_SELECT = {
  id: true,
  displayName: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

export function toUserResponse(user: { id: string; email: string; displayName: string | null; avatarUrl: string | null }) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  };
}

export function emitEvent(event: string, data: unknown) {
  const io = (global as any).__io;
  if (io) io.emit(event, data);
}

export function emitToRoom(room: string, event: string, data: unknown) {
  const io = (global as any).__io;
  if (io) io.to(room).emit(event, data);
}
