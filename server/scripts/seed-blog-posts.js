// Seeds five original, clinic-branded example articles. Safe to rerun:
// existing posts are never overwritten, and no patient/doctor/appointment data is touched.
import 'dotenv/config';
import mongoose from 'mongoose';
import BlogPost from '../src/models/BlogPost.js';
import BlogCategory, { DEFAULT_CATEGORIES } from '../src/models/BlogCategory.js';
import User from '../src/models/User.js';
import { readingMinutes } from '../src/utils/blog.js';

const EDITORIAL_BYLINE = 'Tulasi Healthcare Editorial Team';

const ARTICLES = [
  {
    slug: 'understanding-mental-health-breaking-the-stigma',
    title: 'Understanding Mental Health: Breaking the Stigma',
    excerpt: 'Mental health is an essential part of overall well-being. Learn what it means, why stigma persists, and how everyday conversations can make seeking support easier.',
    category: 'mental-health-awareness',
    tags: ['mental health', 'well-being', 'stigma', 'awareness'],
    seoTitle: 'Understanding Mental Health and Breaking Stigma',
    seoDescription: 'Explore what mental health means, challenge common misconceptions, and learn how to create supportive conversations.',
    content: `## Mental health is part of health

Mental health influences how we think, feel, relate to others and respond to everyday challenges. It is not separate from physical health, and it is not simply the absence of a diagnosis. Everyone has mental health, and it can change across different stages of life.

## Moving beyond common myths

A person experiencing emotional or psychological difficulties is not weak, and mental health conditions are not character flaws. They can arise through a combination of biological, psychological, social and environmental factors. They can affect people of every age and background.

Another common misconception is that someone should manage everything alone. Support from trusted people and qualified professionals can make a meaningful difference. Asking for help is a practical step, not a failure.

## Small ways to make conversations safer

- Listen without rushing to judge, fix or compare someone's experience.
- Ask what kind of support would be helpful instead of making assumptions.
- Use respectful language and avoid labels that reduce a person to a diagnosis.
- Respect privacy. Someone's health information is theirs to share.
- Encourage professional support when distress persists or affects daily life.

## When to consider professional support

If changes in mood, thoughts, sleep, energy or behaviour persist, feel overwhelming, or interfere with relationships, studies, work or daily routines, consider speaking with a qualified mental health professional. You do not need to wait until things feel unbearable.

## A more supportive culture starts with us

Mental health awareness grows when people can speak openly and be treated with dignity. A thoughtful question, a non-judgmental conversation and access to appropriate care can all help reduce stigma.

*This article is for general educational purposes only. It does not provide a diagnosis or replace individual medical advice, assessment or treatment. If you have concerns about your mental health, consult a qualified professional.*`
  },
  {
    slug: 'managing-anxiety-in-everyday-life-practical-strategies',
    title: 'Managing Anxiety in Everyday Life: Practical Strategies',
    excerpt: 'Understand everyday anxiety and explore practical grounding, routine and support strategies that may help you navigate stressful moments.',
    category: 'stress-management',
    tags: ['anxiety', 'stress management', 'grounding', 'self-care'],
    seoTitle: 'Practical Strategies for Managing Everyday Anxiety',
    seoDescription: 'Learn practical ways to respond to anxious moments, build supportive routines and recognise when professional help may be useful.',
    content: `## First, understand the experience

Anxiety is a common response to uncertainty, pressure or perceived threat. It can show up as persistent worry, restlessness, muscle tension, difficulty concentrating or changes in sleep. Occasional anxiety is part of being human; frequent or intense anxiety that disrupts daily life deserves attention.

## Practical strategies to try

### Bring attention to the present

When thoughts begin racing, gently notice what is around you. Name a few things you can see, hear and feel. Slow, comfortable breathing may also help you pause. Do not force deep breaths if that feels uncomfortable.

### Break the next step into something manageable

Instead of trying to solve every concern at once, identify one small action you can take now. Write down what is within your control and what may need to wait.

### Support your basic routines

Regular meals, movement that feels appropriate for you, a consistent sleep schedule and time away from constant notifications can support general well-being. These habits are not a substitute for treatment, but they can form part of a supportive routine.

### Make room for connection

Consider speaking with someone you trust. You do not have to explain everything perfectly. You might simply say, “I have been feeling overwhelmed and could use someone to listen.”

## Notice patterns without judging yourself

A brief note about situations, thoughts, physical sensations and responses may help you identify recurring patterns. Treat this as information, not a scorecard. If tracking increases your worry, stop and choose a simpler approach.

## When to seek additional help

Consider professional support if anxiety is persistent, difficult to manage, leads you to avoid important activities, or affects sleep, relationships, study or work. A qualified clinician can help assess what is happening and discuss appropriate options.

*This article is educational and is not a diagnostic tool or a substitute for personalised care. Strategies that help one person may not suit another. Speak with a qualified health professional about persistent or distressing symptoms.*`
  },
  {
    slug: 'understanding-depression-signs-symptoms-and-support',
    title: 'Understanding Depression: Signs, Symptoms and Support',
    excerpt: 'Depression is more than a difficult day or a passing low mood. Learn about possible signs, how it can affect daily life and where support can begin.',
    category: 'psychiatry',
    tags: ['depression', 'mood', 'mental health support', 'psychiatry'],
    seoTitle: 'Understanding Depression: Signs and Support Options',
    seoDescription: 'Learn about common signs of depression, how it may affect daily life and why a professional assessment matters.',
    content: `## Depression is more than feeling sad

Depression is a mental health condition that can affect mood, thinking, energy, sleep, appetite, motivation and the ability to enjoy everyday activities. It is not a personal weakness, and a person cannot always overcome it by simply trying harder.

People experience depression differently. Some may feel persistently low; others may notice irritability, emotional numbness, fatigue or difficulty concentrating.

## Signs that may deserve attention

Possible signs include:

- A persistent low, empty or irritable mood.
- Reduced interest or pleasure in activities.
- Changes in sleep or appetite.
- Low energy or a sense of being slowed down.
- Difficulty concentrating or making decisions.
- Feelings of worthlessness, excessive guilt or hopelessness.
- Withdrawing from people or usual responsibilities.

These experiences can have different causes. A list of symptoms cannot establish a diagnosis, and a qualified professional can help assess them in context.

## How to support someone

Listen with patience and avoid statements that minimise their experience. Offer practical help, such as accompanying them to an appointment, while respecting their choices and privacy. Keep checking in without demanding that they feel better immediately.

## Treatment and support are available

A mental health professional can discuss assessment and suitable care options. Depending on the individual, support may involve psychotherapy, medication, lifestyle adjustments or a combination. The right plan is personal and should be discussed with a qualified clinician.

If symptoms are persistent, worsening or interfering with everyday life, reaching out sooner can be helpful. If someone may be in immediate danger or unable to stay safe, seek urgent local emergency help.

## A compassionate next step

You do not need to have all the right words before asking for help. Describing what has changed and how long it has been happening is a useful place to start.

*This article is for general information only and does not diagnose depression or replace professional assessment. If you are concerned about yourself or someone else, contact a qualified mental health professional or local emergency service when there is immediate risk.*`
  },
  {
    slug: 'how-sleep-affects-your-mental-well-being',
    title: 'How Sleep Affects Your Mental Well-being',
    excerpt: 'Sleep and mental well-being influence one another. Explore how a steady routine and a supportive sleep environment can help.',
    category: 'sleep-and-lifestyle',
    tags: ['sleep', 'well-being', 'healthy routines', 'lifestyle'],
    seoTitle: 'How Sleep Influences Mental Well-being',
    seoDescription: 'Understand the relationship between sleep and emotional well-being, with practical ideas for a more consistent routine.',
    content: `## Sleep and mental well-being are connected

Sleep gives the brain and body time to rest and recover. When sleep is regularly disrupted, some people notice changes in mood, concentration, patience and their ability to manage stress. Emotional distress can also make it harder to fall asleep or stay asleep.

This relationship is not the same for everyone, and sleep difficulties can have many causes.

## Build a routine that is realistic

- Try to keep your sleep and wake times reasonably consistent.
- Create a short wind-down routine that helps you transition out of the day.
- Make your bedroom as comfortable, quiet and dark as practical.
- If late caffeine affects your sleep, consider reducing it later in the day.
- Get daylight and movement during the day when possible.
- If you are awake and becoming frustrated, try a quiet, relaxing activity until you feel sleepy.

You do not need a perfect routine. Small changes that you can maintain are often more useful than strict rules that create additional pressure.

## Be careful with quick fixes

Alcohol, unprescribed medication or supplements should not be used as a do-it-yourself sleep treatment. If you are considering a sleep aid, discuss its suitability and risks with a qualified health professional.

## When sleep problems need attention

Speak with a healthcare professional if sleep difficulties continue, significantly affect your daytime functioning, or occur alongside persistent changes in mood or anxiety. Loud snoring, gasping during sleep or severe daytime sleepiness are also reasons to seek medical advice.

## Rest is part of well-being

Sleep is one part of a wider picture that includes physical health, relationships, daily demands and emotional support. If your sleep has changed, approach it with curiosity rather than self-blame and seek help when you need it.

*This article provides general education, not individual medical advice. Persistent sleep problems or significant daytime symptoms should be discussed with a qualified healthcare professional.*`
  },
  {
    slug: 'when-to-seek-professional-mental-health-support',
    title: 'When Should You Seek Professional Mental Health Support?',
    excerpt: 'You do not have to wait for a crisis to speak with a professional. Learn what changes may be worth discussing and what to expect from a first appointment.',
    category: 'expert-insights',
    tags: ['professional support', 'therapy', 'psychiatry', 'appointments'],
    seoTitle: 'When to Seek Professional Mental Health Support',
    seoDescription: 'Understand when to consider mental health support and how to prepare for an initial consultation with a professional.',
    content: `## You do not need to reach a breaking point

People seek mental health support for many reasons: persistent worry, low mood, changes in sleep, relationship difficulties, grief, stress, changes in behaviour or simply wanting help understanding what they are experiencing. There is no single threshold that applies to everyone.

## Signs it may be time to reach out

Consider speaking with a qualified professional when:

- Emotional distress continues or keeps returning.
- Sleep, appetite, energy or concentration has changed noticeably.
- Work, studies, relationships or daily responsibilities are becoming harder.
- You are withdrawing from activities or people that matter to you.
- You rely on habits or substances in ways that concern you.
- Friends or family have noticed changes and you are also concerned.

You can seek guidance even if you are unsure whether what you are experiencing is a mental health condition.

## What happens during an initial appointment?

A first consultation commonly includes a conversation about what brought you in, how long changes have been happening, relevant health history and what you hope to get from support. You can ask questions about the professional's approach, confidentiality, fees and possible next steps.

You may find it helpful to note a few concerns beforehand. You do not need to prepare a perfect explanation, and you can say if a question feels difficult to answer.

## Choosing the right kind of support

Psychiatrists are medical doctors who assess mental health conditions and can discuss medical treatment, including medication when appropriate. Psychologists and other qualified mental health professionals may provide psychological assessment and therapy within their training and scope of practice. The most suitable starting point depends on your needs and circumstances.

## If the situation is urgent

If you or someone else is at immediate risk of harm, seek urgent local emergency assistance rather than waiting for a routine appointment. If possible, stay with a trusted person while help is arranged.

## Taking the first step

Reaching out is not a commitment to a particular treatment. It is an opportunity to understand your options and decide on next steps with a qualified professional.

*This article is for general information and does not replace individual medical advice, diagnosis or treatment. The appropriate care pathway depends on each person's circumstances.*`
  }
];

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  await mongoose.connect(process.env.MONGODB_URI);

  for (const category of DEFAULT_CATEGORIES) {
    await BlogCategory.updateOne(
      { slug: category.slug },
      { $setOnInsert: category },
      { upsert: true, runValidators: true }
    );
  }

  const author = await User.findOne({ role: 'admin', isActive: true }).sort({ createdAt: 1 }).select('_id');
  if (!author) {
    throw new Error('No active admin account exists. Sign in with an admin account or create the admin account before seeding blog articles.');
  }

  let created = 0;
  let skipped = 0;
  for (const article of ARTICLES) {
    const result = await BlogPost.updateOne(
      { slug: article.slug },
      {
        $setOnInsert: {
          ...article,
          author: author._id,
          authorDisplayName: EDITORIAL_BYLINE,
          status: 'published',
          publishedAt: new Date(),
          readingMinutes: readingMinutes(article.content),
          coverImage: '',
        },
      },
      { upsert: true, runValidators: true }
    );

    if (result.upsertedCount) created += 1;
    else skipped += 1;
  }

  console.log(`Blog article seeding complete. Created: ${created}; already existed and left unchanged: ${skipped}.`);
}

try {
  await main();
} catch (error) {
  console.error('Blog article seeding failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
