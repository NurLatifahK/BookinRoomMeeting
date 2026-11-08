import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'bank_raya_super_secure_jwt_secret_key_2026_digital_kompre';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email / Personal Number dan password wajib diisi.',
      });
    }

    const cleanInput = username.trim();
    const cleanLower = cleanInput.toLowerCase();
    const cleanUpper = cleanInput.toUpperCase();
    const emailPrefix = cleanInput.split('@')[0];

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanInput },
          { username: cleanLower },
          { username: emailPrefix },
          { pn: cleanInput },
          { pn: cleanUpper },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email/PN atau password salah.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.',
      });
    }

    const payload = {
      id: user.id,
      username: user.username,
      name: user.name,
      pn: user.pn,
      role: user.role,
      division: user.division,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: (JWT_EXPIRES_IN || '7d') as any });

    return res.status(200).json({
      success: true,
      message: 'Login berhasil. Selamat datang di Portal Meeting Room Bank Raya.',
      data: {
        token,
        user: payload,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat login.',
      error: error.message,
    });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Tidak terotentikasi.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        name: true,
        pn: true,
        role: true,
        division: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan.',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('getMe error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data profil pengguna.',
      error: error.message,
    });
  }
};
