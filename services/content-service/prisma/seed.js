require('dotenv').config({ path: '../../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.course.deleteMany();

  const course1 = await prisma.course.create({
    data: {
      title: "Giới thiệu về react",
      description: "Khóa học này sẽ giúp bạn hiểu về react",
      instructorId: "123e4567-e89b-12d3-a456-426614174000",
      price: 100,
      isFree: false,
      status: "PUBLISHED",
      modules: {
        create: [
          {
            title: "Module 1: React cơ bản",
            description: "Tìm hiểu về các khái niệm cơ bản của React",
            orderIndex: 1,
            status: "PUBLISHED",
            lessons: {
              create: [
                {
                  title: "Bài 1: React là gì?",
                  duration: 10,
                  orderIndex: 1,
                  status: "PUBLISHED",
                  milestones: {
                    create: [
                      {
                        userId: "11111111-1111-1111-1111-111111111111",
                        title: "Hoàn thành Bài 1: React cơ bản",
                        targetDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // Deadline 2 ngày kể từ hiện tại
                      }
                    ]
                  },
                  contentItems: {
                    create: [
                      {
                        type: "VIDEO",
                        title: "Giới thiệu về React",
                        contentUrl: "https://example.com/video1.mp4",
                        orderIndex: 1,
                        status: "PUBLISHED",
                        duration: 300
                      },
                      {
                        type: "DOCUMENT",
                        title: "Tài liệu React cơ bản",
                        contentUrl: "https://example.com/doc1.pdf",
                        orderIndex: 2,
                        status: "PUBLISHED"
                      },
                      {
                        type: "QUIZ",
                        title: "Quiz: Kiến thức cơ bản về React",
                        orderIndex: 3,
                        status: "PUBLISHED",
                        metadata: {
                          timeLimit: 15,
                          passingScore: 80,
                          maxAttempts: 3,
                          questions: [
                            {
                              id: "q1",
                              text: "React là gì?",
                              options: [
                                { id: "o1", text: "Một framework UI của JavaScript" },
                                { id: "o2", text: "Một thư viện UI của JavaScript" },
                                { id: "o3", text: "Một hệ quản trị cơ sở dữ liệu" }
                              ],
                              correctOptionId: "o2"
                            },
                            {
                              id: "q2",
                              text: "Hook nào dùng để quản lý state trong functional component?",
                              options: [
                                { id: "o1", text: "useEffect" },
                                { id: "o2", text: "useContext" },
                                { id: "o3", text: "useState" }
                              ],
                              correctOptionId: "o3"
                            },
                            {
                              id: "q3",
                              text: "JSX là viết tắt của gì?",
                              options: [
                                { id: "o1", text: "JavaScript XML" },
                                { id: "o2", text: "JavaScript Extension" },
                                { id: "o3", text: "Java Syntax XML" }
                              ],
                              correctOptionId: "o1"
                            }
                          ]
                        }
                      }
                    ]
                  }
                },
                {
                  title: "Bài 2: JSX là gì?",
                  duration: 15,
                  orderIndex: 2,
                  status: "PUBLISHED",
                  milestones: {
                    create: [
                      {
                        userId: "11111111-1111-1111-1111-111111111111",
                        title: "Hoàn thành phân tích JSX và bài IELTS",
                        targetDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // Deadline 5 ngày kể từ hiện tại
                      }
                    ]
                  },
                  contentItems: {
                    create: [
                      {
                        type: "VIDEO",
                        title: "Giới thiệu về JSX",
                        contentUrl: "https://example.com/video2.mp4",
                        orderIndex: 1,
                        status: "PUBLISHED",
                        duration: 300
                      },
                      {
                        type: "AUDIO",
                        title: "Podcast: Lắng nghe tâm sự về việc học JSX",
                        contentUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                        description: "Một bản audio ngắn để kiểm tra chức năng AudioPlayer",
                        orderIndex: 2,
                        status: "PUBLISHED"
                      },
                      {
                        type: "INFOGRAPHIC",
                        title: "Biểu đồ phát triển của React",
                        description: "<p>Phân tích chi tiết về sự phát triển của hệ sinh thái React trong những năm qua, số liệu này mang tính chất minh hoạ.</p>",
                        contentUrl: "https://example.com/infographic-react.jpg",
                        orderIndex: 3,
                        status: "PUBLISHED"
                      },
                      {
                        type: "DOCUMENT",
                        title: "Tài liệu JSX",
                        contentUrl: "https://example.com/doc2.pdf",
                        orderIndex: 4,
                        status: "PUBLISHED"
                      },
                      {
                        type: "PRACTICE_WRITING",
                        title: "Luyện viết: Academic Writing",
                        orderIndex: 5,
                        status: "PUBLISHED",
                        metadata: {
                          prompt: "The chart below shows the percentage of households in different income brackets that own a smartphone in three countries. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.",
                          imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000",
                          minWords: 150,
                          maxTime: 20,
                          style: "formal, academic style"
                        }
                      },
                      {
                        type: "PRACTICE_SPEAKING",
                        title: "Speaking Fluency Practice",
                        orderIndex: 6,
                        status: "PUBLISHED",
                        metadata: {
                          assessmentTitle: "Speaking Assessment",
                          prompt: "Describe a place you have visited that has a significant cultural impact on you."
                        }
                      },
                      {
                        type: "DICTATION",
                        title: "Luyện nghe chép chính tả (Dictation)",
                        contentUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
                        orderIndex: 7,
                        status: "PUBLISHED",
                        metadata: {
                          correctTranscript: "This is a dummy transcript for the dictation practice."
                        }
                      },
                      {
                        type: "QUIZ",
                        title: "Reading Comprehension Test",
                        description: "Read the passage and answer the questions.",
                        orderIndex: 8,
                        status: "PUBLISHED",
                        metadata: {
                          quizLayout: "split-screen",
                          passageTitle: "The Industrial Revolution",
                          passageContent: "The Industrial Revolution marked a major turning point in human history. It began in Britain in the late 18th century and gradually spread to other parts of Europe and North America. This period saw the transition from manual production methods to machines, new chemical manufacturing processes, and improved efficiency in water power and steam power.\n\nThe revolution had profound effects on society. Urban populations grew rapidly as people moved from rural areas to cities in search of work in the new factories. Living conditions in these industrial cities were often poor, with overcrowding and pollution being major problems. However, the revolution also led to increased production, higher standards of living for some, and technological innovations that would shape the modern world.",
                          assessmentTitle: "IELTS Reading Quiz",
                          passingScore: 100,
                          timeLimit: 10,
                          questions: [
                            {
                              id: "q1",
                              text: "Where did the Industrial Revolution begin?",
                              type: "MULTIPLE_CHOICE",
                              options: [
                                { id: "o1", text: "North America" },
                                { id: "o2", text: "Britain" },
                                { id: "o3", text: "France" },
                                { id: "o4", text: "Germany" }
                              ],
                              correctOptionId: "o2"
                            },
                            {
                              id: "q2",
                              text: "Which of the following was NOT a result of the Industrial Revolution mentioned in the passage?",
                              type: "MULTIPLE_CHOICE",
                              options: [
                                { id: "o1", text: "Transition to machine production" },
                                { id: "o2", text: "Rapid urban population growth" },
                                { id: "o3", text: "Improved living conditions for everyone" },
                                { id: "o4", text: "Technological innovations" }
                              ],
                              correctOptionId: "o3"
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    }
  });

  await prisma.enrollment.create({
    data: {
      userId: "11111111-1111-1111-1111-111111111111",
      courseId: course1.courseId,
      status: "ACTIVE"
    }
  });

  console.log("Seed data created successfully:", course1.title);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });