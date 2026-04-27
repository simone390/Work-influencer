import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// One-time setup endpoint — delete this file after first use
export async function GET() {
  try {
    const existing = await prisma.user.findUnique({
      where: { email: 'Simone@just4you-agency.it' },
    })

    if (existing) {
      return NextResponse.json({ message: 'Account già esistente', email: existing.email })
    }

    const password = await bcrypt.hash('Erebus123', 12)
    const user = await prisma.user.create({
      data: {
        name: 'Simone',
        email: 'Simone@just4you-agency.it',
        password,
        role: 'MANAGER',
      },
      select: { id: true, name: true, email: true, role: true },
    })

    return NextResponse.json({ message: 'Account creato con successo', user })
  } catch (err) {
    console.error('Setup error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
