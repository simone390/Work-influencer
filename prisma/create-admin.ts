import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('Erebus123', 12)

  const user = await prisma.user.upsert({
    where: { email: 'Simone@just4you-agency.it' },
    update: {
      name: 'Simone',
      password,
      role: 'MANAGER',
    },
    create: {
      name: 'Simone',
      email: 'Simone@just4you-agency.it',
      password,
      role: 'MANAGER',
    },
  })

  console.log('✅ Account admin creato:')
  console.log('   Email:', user.email)
  console.log('   Nome:', user.name)
  console.log('   Ruolo:', user.role)
}

main()
  .catch((e) => {
    console.error('❌ Errore:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
