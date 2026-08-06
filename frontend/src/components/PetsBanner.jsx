export default function PetsBanner() {
  const items = [
    { icon: '🐕', label: 'Dogs' },
    { icon: '🐈', label: 'Cats' },
    { icon: '🐇', label: 'Rabbits' },
    { icon: '🦜', label: 'Birds' },
    { icon: '🐠', label: 'Fish' },
    { icon: '🐹', label: 'Hamsters' },
    { icon: '🦔', label: 'Hedgehogs' },
    { icon: '🐢', label: 'Tortoises' },
    { icon: '🩺', label: 'Expert Vets' },
    { icon: '💊', label: 'Modern Medicine' },
    { icon: '📋', label: 'Digital Records' },
  ]

  return (
    <div className="pets-banner" aria-hidden="true">
      <div className="pets-track">
        {[...items, ...items].map((item, i) => (
          <div className="pets-track-item" key={i}>
            <span className="icon">{item.icon}</span> {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}
