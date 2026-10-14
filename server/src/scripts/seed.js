/**
 * Seeds demo researchers so search & recommendations can be demonstrated.
 *   npm run seed            -> adds demo users (skips existing emails)
 *   npm run seed -- --fresh -> deletes previous demo users first
 * All demo accounts use the password:  Demo@1234
 */
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');

const PASSWORD = 'Demo@1234';
const DEMO_DOMAIN = 'demo.researchhub.edu';

const people = [
  ['Dr. Farhana Rahman', 'professor', 'Daffodil International University', 'Software Engineering', 'Associate Professor',
    ['Machine Learning', 'Natural Language Processing'], [['Python', 'expert'], ['PyTorch', 'advanced'], ['Scientific Writing', 'expert']],
    ['Bangla NLP', 'Large Language Models', 'Fake News Detection'], ['Peer Review', 'Grant Writing']],
  ['Tanvir Ahmed', 'thesis_student', 'Daffodil International University', 'Software Engineering', 'MSc Student',
    ['Natural Language Processing'], [['Python', 'advanced'], ['TensorFlow', 'intermediate'], ['LaTeX', 'intermediate']],
    ['Bangla NLP', 'Sentiment Analysis'], ['Dataset Curation']],
  ['Nusrat Jahan', 'researcher', 'BUET', 'Computer Science & Engineering', 'Research Assistant',
    ['Computer Vision', 'Machine Learning'], [['PyTorch', 'advanced'], ['OpenCV', 'advanced'], ['Python', 'expert']],
    ['Medical Imaging', 'Explainable AI'], ['Model Evaluation', 'Experimental Design']],
  ['Prof. Kamal Hossain', 'professor', 'University of Dhaka', 'Computer Science & Engineering', 'Professor',
    ['Data Science', 'Health Informatics'], [['R', 'expert'], ['Statistical Analysis', 'expert'], ['SQL', 'advanced']],
    ['Public Health Analytics', 'Explainable AI'], ['Quantitative Research', 'Systematic Review']],
  ['Sadia Islam', 'student', 'North South University', 'Electrical & Computer Engineering', 'Undergraduate',
    ['Internet of Things', 'Embedded Systems'], [['C++', 'intermediate'], ['Arduino', 'advanced'], ['Python', 'beginner']],
    ['Smart Agriculture', 'Edge Computing'], ['Prototyping']],
  ['Arif Chowdhury', 'researcher', 'BRAC University', 'Computer Science', 'Lecturer',
    ['Cybersecurity', 'Blockchain'], [['Solidity', 'advanced'], ['Python', 'advanced'], ['Network Security', 'expert']],
    ['Smart Contracts', 'Privacy-Preserving ML', 'Federated Learning'], ['Threat Modeling']],
  ['Maliha Khan', 'thesis_student', 'Daffodil International University', 'Software Engineering', 'BSc Thesis Student',
    ['Software Engineering', 'Machine Learning'], [['JavaScript', 'advanced'], ['React', 'advanced'], ['Python', 'intermediate']],
    ['Software Testing', 'Recommender Systems'], ['Literature Review']],
  ['Dr. Rezaul Karim', 'professor', 'Khulna University', 'Computer Science & Engineering', 'Professor',
    ['Artificial Intelligence', 'Robotics'], [['MATLAB', 'expert'], ['C++', 'advanced'], ['ROS', 'advanced']],
    ['Autonomous Systems', 'Reinforcement Learning'], ['Grant Writing', 'Experimental Design']],
  ['Ishrat Jahan Mim', 'student', 'Daffodil International University', 'Computer Science & Engineering', 'Undergraduate',
    ['Human-Computer Interaction', 'Educational Technology'], [['Figma', 'advanced'], ['JavaScript', 'intermediate'], ['Survey Design', 'intermediate']],
    ['Accessibility', 'E-learning'], ['Qualitative Research']],
  ['Mehedi Hasan Rony', 'researcher', 'SUST', 'Computer Science & Engineering', 'Research Engineer',
    ['Natural Language Processing', 'Machine Learning'], [['Python', 'expert'], ['Hugging Face', 'advanced'], ['PyTorch', 'advanced']],
    ['Large Language Models', 'Bangla NLP', 'Speech Recognition'], ['Model Evaluation', 'Dataset Curation']],
  ['Dr. Shirin Akter', 'professor', 'Jahangirnagar University', 'Environmental Science', 'Associate Professor',
    ['Climate Informatics', 'Data Science'], [['R', 'advanced'], ['GIS', 'expert'], ['Statistical Analysis', 'advanced']],
    ['Climate Change', 'Remote Sensing', 'Smart Agriculture'], ['Field Research', 'Grant Writing']],
  ['Rakibul Hasan', 'thesis_student', 'BUET', 'Computer Science & Engineering', 'MSc Student',
    ['Cloud Computing', 'Distributed Systems'], [['Go', 'advanced'], ['Docker', 'advanced'], ['Kubernetes', 'intermediate']],
    ['Edge Computing', 'Serverless Computing'], ['Benchmarking']],
  ['Afsana Mimi', 'researcher', 'Daffodil International University', 'Software Engineering', 'Lecturer',
    ['Software Engineering', 'Data Science'], [['Java', 'expert'], ['Python', 'advanced'], ['MongoDB', 'advanced']],
    ['Software Testing', 'Mining Software Repositories', 'Recommender Systems'], ['Empirical Research', 'Peer Review']],
  ['Zahid Hasan', 'student', 'AIUB', 'Computer Science', 'Undergraduate',
    ['Computer Vision'], [['Python', 'intermediate'], ['OpenCV', 'intermediate'], ['TensorFlow', 'beginner']],
    ['Medical Imaging', 'Object Detection'], []],
  ['Dr. Nazmul Haque', 'professor', 'BRAC University', 'Public Health', 'Professor',
    ['Health Informatics', 'Bioinformatics'], [['R', 'expert'], ['Python', 'advanced'], ['Statistical Analysis', 'expert']],
    ['Genomics', 'Public Health Analytics', 'Medical Imaging'], ['Systematic Review', 'Grant Writing', 'Peer Review']],
];

/** Inserts the demo researchers (skips emails that already exist). Assumes an open connection. */
async function seedDemo({ fresh = false } = {}) {
  if (fresh) {
    const { deletedCount } = await User.deleteMany({ email: new RegExp(`@${DEMO_DOMAIN.replace(/\./g, '\\.')}$`) });
    console.log(`[seed] removed ${deletedCount} previous demo users`);
  }

  let created = 0;
  for (const [name, role, institution, department, designation, domains, skills, interests, expertise] of people) {
    const email = `${name.toLowerCase().replace(/^(dr|prof)\.\s*/, '').replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}@${DEMO_DOMAIN}`;
    // eslint-disable-next-line no-await-in-loop
    if (await User.exists({ email })) continue;
    // eslint-disable-next-line no-await-in-loop
    await User.create({
      name,
      email,
      password: PASSWORD,
      role,
      institution,
      department,
      designation,
      headline: `${designation} · ${domains.join(' & ')}`,
      bio: `${name.split(' ').slice(-2).join(' ')} works on ${domains.join(' and ').toLowerCase()} at ${institution}, with a focus on ${interests.slice(0, 2).join(' and ').toLowerCase()}.`,
      researchDomains: domains,
      skills: skills.map(([n, level]) => ({ name: n, level })),
      interests,
      expertise,
      location: 'Dhaka, Bangladesh',
    });
    created += 1;
  }
  console.log(`[seed] created ${created} demo researchers (password: ${PASSWORD})`);
  return created;
}

async function run() {
  await connectDB();
  await seedDemo({ fresh: process.argv.includes('--fresh') });
  await disconnectDB();
}

if (require.main === module) {
  run().catch(async (err) => {
    console.error('[seed] failed:', err);
    await disconnectDB();
    process.exit(1);
  });
}

module.exports = { seedDemo };
