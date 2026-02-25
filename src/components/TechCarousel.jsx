import LanguageCard from './LanguageCard';

const languages = [
  {
    name: 'React.js',
    src: '/images/hero/react.png'
  },
  {
    name: 'Node.js',
    src: '/images/hero/node.png'
  },
  {
    name: 'HTML',
    src: '/images/hero/html.png'
  },
  {
    name: 'Java',
    src: '/images/hero/java.png'
  },
  {
    name: 'C++',
    src: '/images/hero/cpp.png'
  },
  {
    name: 'Python',
    src: '/images/hero/python.png'
  },
  {
    name: 'SQL',
    src: '/images/hero/sql.png'
  },
  {
    name: 'JavaScript',
    src: '/images/hero/javascript.png'
  },
];

const PLACEHOLDER_SRC = '/images/hero/placeholder.svg';

const TechCarousel = () => (
  <div className="mx-auto w-full max-w-6xl">
    <div className="grid gap-5 sm:grid-cols-4">
      {languages.map((language) => (
        <LanguageCard
          key={language.name}
          iconSrc={language.src}
          name={language.name}
          description={language.description}
          placeholderSrc={PLACEHOLDER_SRC}
          intensity={16}
          glowColor="rgba(58, 175, 169, 0.35)"
        />
      ))}
    </div>
  </div>
);

export default TechCarousel;

