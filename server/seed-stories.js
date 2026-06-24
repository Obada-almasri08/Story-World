const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultStories = [
  {
    title: "مغامرة في جزيرة الكنز",
    text: "في جزيرة بعيدة، وجد طفل شجاع خريطة قديمة تقوده إلى كنز مخفي. بدأ رحلته بين الأشجار والرمال، وتعلم أن الشجاعة والتفكير هما سر النجاح.",
    category: "adventure",
    imagePath: "/images/story1.jpg" // We will map this in the frontend if needed, but the original frontend expects "images/story1.jpg"
  },
  {
    title: "الأرنب الذكي",
    text: "كان هناك أرنب صغير يعيش في الغابة. كان ذكياً جداً ويحب التفكير قبل التصرف. وفي يوم من الأيام، استطاع بذكائه أن ينقذ أصدقاءه من مشكلة كبيرة.",
    category: "animals",
    imagePath: "/images/story2.jpg"
  },
  {
    title: "رحلة إلى النجوم",
    text: "حلم طفل صغير بالسفر إلى الفضاء. صنع مركبة خيالية، وانطلق في رحلة بين النجوم، ليتعلم أن الأحلام الكبيرة تبدأ بخطوة صغيرة.",
    category: "fantasy",
    imagePath: "/images/story3.jpg"
  },
  {
    title: "كهف الأسرار",
    text: "دخل مغامر صغير إلى كهف غامض مليء بالأسرار. كان عليه أن يحل الألغاز ليصل إلى النهاية، فاكتشف أن المعرفة هي أعظم كنز.",
    category: "adventure",
    imagePath: "/images/story4.jpg"
  }
];

async function seedStories() {
  console.log("Seeding default stories...");
  
  for (const story of defaultStories) {
    const existing = await prisma.story.findFirst({
      where: { title: story.title }
    });

    if (!existing) {
      await prisma.story.create({
        data: story
      });
      console.log(`Created story: ${story.title}`);
    } else {
      console.log(`Story already exists: ${story.title}`);
    }
  }

  console.log("Done seeding stories.");
}

seedStories()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
