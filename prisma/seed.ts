import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { addDays } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create manager user
  const managerPassword = await bcrypt.hash('password123', 10)
  const manager = await prisma.user.upsert({
    where: { email: 'manager@test.com' },
    update: {},
    create: {
      name: 'Marco Bianchi',
      email: 'manager@test.com',
      password: managerPassword,
      role: 'MANAGER',
    },
  })
  console.log('Manager created:', manager.email)

  // Create influencer user
  const influencerPassword = await bcrypt.hash('password123', 10)
  const influencer = await prisma.user.upsert({
    where: { email: 'influencer@test.com' },
    update: {},
    create: {
      name: 'Sofia Rossi',
      email: 'influencer@test.com',
      password: influencerPassword,
      role: 'INFLUENCER',
    },
  })
  console.log('Influencer created:', influencer.email)

  // Create brand
  const brand = await prisma.brand.upsert({
    where: { publicToken: 'techbrand-public-token-demo' },
    update: {},
    create: {
      name: 'TechBrand Italia',
      publicToken: 'techbrand-public-token-demo',
    },
  })
  console.log('Brand created:', brand.name)

  // Create a sample partnership
  const now = new Date()
  const partnership = await prisma.partnership.create({
    data: {
      name: 'Campagna Primavera 2024',
      brandId: brand.id,
      influencerId: influencer.id,
      totalPrice: 2500,
      netPrice: 2000,
      brief: 'Campagna di lancio del nuovo smartphone TechBrand X1. Mostrare le funzionalità della fotocamera e la durata della batteria.',
      status: 'ACTIVE',
    },
  })
  console.log('Partnership created:', partnership.name)

  // Create content for the partnership
  const scriptDeadline = addDays(now, 5)
  const recordingDeadline = addDays(now, 10)
  const postDate = addDays(now, 15)
  const postDateTime = new Date(postDate)
  postDateTime.setHours(18, 0, 0, 0)

  const content = await prisma.content.create({
    data: {
      partnershipId: partnership.id,
      type: 'REEL',
      description: 'Reel Instagram che mostra le funzionalità della fotocamera',
      postInstructions: 'Taggare @TechBrandItalia, usare hashtag #TechBrandX1 #Fotografia #Tech',
      postScheduledAt: postDateTime,
    },
  })
  console.log('Content created:', content.type)

  // Create tasks for the content
  await prisma.contentTask.createMany({
    data: [
      {
        contentId: content.id,
        type: 'WRITE_SCRIPT',
        status: 'IN_PROGRESS',
        dueDate: scriptDeadline,
        order: 1,
        notes: 'Scrivi lo script per il reel della fotocamera',
      },
      {
        contentId: content.id,
        type: 'BRAND_APPROVAL',
        status: 'PENDING',
        order: 2,
      },
      {
        contentId: content.id,
        type: 'RECORD_CONTENT',
        status: 'PENDING',
        dueDate: recordingDeadline,
        order: 3,
      },
      {
        contentId: content.id,
        type: 'BRAND_REVIEW',
        status: 'PENDING',
        order: 4,
      },
      {
        contentId: content.id,
        type: 'POST_CONTENT',
        status: 'PENDING',
        dueDate: postDateTime,
        order: 5,
      },
      {
        contentId: content.id,
        type: 'REPORTING',
        status: 'PENDING',
        dueDate: addDays(postDate, 7),
        order: 6,
      },
      {
        contentId: content.id,
        type: 'SUBMIT_INVOICE',
        status: 'PENDING',
        order: 7,
      },
    ],
  })
  console.log('Tasks created for content')

  // Create a notification for the influencer
  await prisma.notification.create({
    data: {
      userId: influencer.id,
      title: 'Nuovo script da scrivere',
      body: `Devi scrivere lo script per TechBrand Italia entro ${scriptDeadline.toLocaleDateString('it-IT')}`,
      read: false,
    },
  })
  console.log('Notification created')

  // Create a second content piece
  const storyContent = await prisma.content.create({
    data: {
      partnershipId: partnership.id,
      type: 'STORY',
      description: 'Story Instagram con swipe-up link al prodotto',
      postInstructions: 'Inserire link swipe-up alla pagina prodotto. Taggare @TechBrandItalia',
      postScheduledAt: addDays(postDateTime, 1),
    },
  })

  const storyScriptDeadline = addDays(now, 4)
  const storyRecordingDeadline = addDays(now, 9)
  const storyPostDate = addDays(postDateTime, 1)

  await prisma.contentTask.createMany({
    data: [
      {
        contentId: storyContent.id,
        type: 'WRITE_SCRIPT',
        status: 'PENDING',
        dueDate: storyScriptDeadline,
        order: 1,
      },
      {
        contentId: storyContent.id,
        type: 'BRAND_APPROVAL',
        status: 'PENDING',
        order: 2,
      },
      {
        contentId: storyContent.id,
        type: 'RECORD_CONTENT',
        status: 'PENDING',
        dueDate: storyRecordingDeadline,
        order: 3,
      },
      {
        contentId: storyContent.id,
        type: 'BRAND_REVIEW',
        status: 'PENDING',
        order: 4,
      },
      {
        contentId: storyContent.id,
        type: 'POST_CONTENT',
        status: 'PENDING',
        dueDate: storyPostDate,
        order: 5,
      },
      {
        contentId: storyContent.id,
        type: 'REPORTING',
        status: 'PENDING',
        dueDate: addDays(storyPostDate, 7),
        order: 6,
      },
      {
        contentId: storyContent.id,
        type: 'SUBMIT_INVOICE',
        status: 'PENDING',
        order: 7,
      },
    ],
  })
  console.log('Second content and tasks created')

  console.log('\nSeed completed successfully!')
  console.log('Login credentials:')
  console.log('  Manager: manager@test.com / password123')
  console.log('  Influencer: influencer@test.com / password123')
  console.log(`  Brand public URL: /brand/${brand.publicToken}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
