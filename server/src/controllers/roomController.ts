import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getRooms = async (req: Request, res: Response) => {
  try {
    const { floor, status } = req.query;

    const where: any = {};
    if (floor) {
      where.floor = parseInt(floor as string, 10);
    }
    if (status) {
      where.status = status as string;
    }

    const rooms = await prisma.room.findMany({
      where,
      orderBy: [{ floor: 'asc' }, { name: 'asc' }],
    });

    return res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error: any) {
    console.error('getRooms error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat data ruangan.',
      error: error.message,
    });
  }
};

export const getRoomById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
            status: { not: 'CANCELLED' },
          },
          orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
          take: 10,
        },
      },
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Ruangan tidak ditemukan.',
      });
    }

    return res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error: any) {
    console.error('getRoomById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat data detail ruangan.',
      error: error.message,
    });
  }
};

export const updateRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, capacity, facilities, status, description } = req.body;

    const existing = await prisma.room.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Ruangan tidak ditemukan.',
      });
    }

    const updated = await prisma.room.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(capacity !== undefined && { capacity: parseInt(capacity, 10) }),
        ...(facilities && { facilities }),
        ...(status && { status }),
        ...(description !== undefined && { description }),
      },
    });

    return res.status(200).json({
      success: true,
      message: `Data ruangan ${updated.name} (Lantai ${updated.floor}) berhasil diperbarui.`,
      data: updated,
    });
  } catch (error: any) {
    console.error('updateRoom error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui data ruangan.',
      error: error.message,
    });
  }
};

