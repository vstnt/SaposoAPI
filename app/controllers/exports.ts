import app from '@adonisjs/core/services/app';
import fs from 'node:fs';

export async function deleteOldImage(imagePath: string | null) {
  if (imagePath) {
    const completePath = app.makePath(imagePath);
    if (fs.existsSync(completePath)) {
      fs.unlinkSync(completePath);
    }
  }
}

export const imgSize = '3mb'

export const extTypes = ['jpg', 'JPG', 'jpeg', 'png', 'PNG', 'gif']

export const usersImgsUrl = 'http://localhost:3333/uploads/usersImgs/'
export const usersImgsPath = 'public/uploads/usersImgs/'
export const usersImgsPublicPath = 'uploads/usersImgs/'
export const productsImgsUrl = 'http://localhost:3333/uploads/productsImgs/'
export const productsImgsPath = 'public/uploads/productsImgs/'
export const productsImgsPublicPath = 'uploads/productsImgs/'

