import React from 'react';

export const getSpeciesMeta = (species) => {
  const s = (species || '').toLowerCase().trim();
  if (s === 'dog' || s === 'canine' || s.includes('dog') || s.includes('canine')) {
    return { name: 'Dog', icon: '🐶', key: 'dog' };
  }
  if (s === 'cat' || s === 'feline' || s.includes('cat') || s.includes('feline')) {
    return { name: 'Cat', icon: '🐈‍⬛', key: 'cat' };
  }
  if (s === 'bird' || s === 'avian' || s.includes('bird') || s.includes('avian')) {
    return { name: 'Bird', icon: '🦜', key: 'bird' };
  }
  if (s === 'rabbit' || s.includes('rabbit')) {
    return { name: 'Rabbit', icon: '🐰', key: 'rabbit' };
  }
  return {
    name: species ? species.charAt(0).toUpperCase() + species.slice(1) : 'Pet',
    icon: '🐾',
    key: 'other',
  };
};

export const PetAvatar = ({ species, size = 40 }) => {
  const meta = getSpeciesMeta(species);
  return (
    <div
      className={`pet-avatar-icon pet-avatar-${meta.key}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        fontSize: '1.35rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
      }}
      title={`Species: ${meta.name}`}
    >
      <span style={{ transform: 'translateY(-1px)' }}>{meta.icon}</span>
    </div>
  );
};

export const SpeciesPill = ({ species }) => {
  const meta = getSpeciesMeta(species);
  return (
    <span className={`species-pill ${meta.key}`}>
      {meta.icon} {meta.name}
    </span>
  );
};

export const PetCell = ({ petName, species, ownerInfo = null, showPill = false }) => {
  return (
    <div className="pet-cell">
      <PetAvatar species={species} />
      <div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{petName || 'Patient'}</strong>
          {showPill && <SpeciesPill species={species} />}
        </div>
        {ownerInfo && (
          <small style={{ color: '#64748b', display: 'block', marginTop: '0.15rem' }}>
            {ownerInfo}
          </small>
        )}
      </div>
    </div>
  );
};
