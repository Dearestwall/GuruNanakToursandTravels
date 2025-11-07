// =====================================================
// NETLIFY CMS PREVIEW TEMPLATES
// =====================================================

// Tour Preview
CMS.registerPreviewTemplate('tours', ({ entry, widgetFor }) => {
  const title = entry.getIn(['data', 'name']);
  const image = entry.getIn(['data', 'image']);
  const price = entry.getIn(['data', 'price']);
  const duration = entry.getIn(['data', 'duration']);
  
  return `
    <div style="font-family: system-ui, sans-serif; padding: 20px; background: #f5f5f5; max-width: 800px;">
      <h1 style="color: #0a3d62; margin-bottom: 1rem;">${title}</h1>
      ${image ? `<img src="${image}" alt="${title}" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 1rem;">` : ''}
      <div style="background: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
        <p><strong>Duration:</strong> ${duration || 'N/A'}</p>
        <p><strong>Price:</strong> ₹${price || 0}</p>
      </div>
      <div style="background: white; padding: 1rem; border-radius: 8px;">
        ${widgetFor('description')}
      </div>
    </div>
  `;
});

// Blog Preview
CMS.registerPreviewTemplate('blog', ({ entry, widgetFor }) => {
  const title = entry.getIn(['data', 'title']);
  const date = entry.getIn(['data', 'date']);
  const image = entry.getIn(['data', 'image']);
  const author = entry.getIn(['data', 'author']);
  
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: white;">
      <h1 style="color: #0a3d62; margin-bottom: 0.5rem;">${title}</h1>
      <small style="color: #666;">
        ${date} • By ${author}
      </small>
      ${image ? `<img src="${image}" alt="${title}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 1.5rem 0;">` : ''}
      <div style="line-height: 1.8;">
        ${widgetFor('content')}
      </div>
    </div>
  `;
});

// Testimonial Preview
CMS.registerPreviewTemplate('testimonials', ({ entry }) => {
  const name = entry.getIn(['data', 'name']);
  const rating = entry.getIn(['data', 'rating']);
  const comment = entry.getIn(['data', 'comment']);
  const photo = entry.getIn(['data', 'photo']);
  const location = entry.getIn(['data', 'location']);
  
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; padding: 20px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #0e5aa7;">
      <div style="display: flex; gap: 1rem;">
        ${photo ? `<img src="${photo}" alt="${name}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">` : ''}
        <div style="flex-grow: 1;">
          <h3 style="margin: 0 0 0.25rem 0; color: #0a3d62;">${name}</h3>
          <small style="color: #666;">${location || ''}</small>
          <div style="color: #f39c12; margin: 0.5rem 0;">
            ${'⭐'.repeat(Math.min(5, Math.max(1, parseInt(rating))))}
          </div>
        </div>
      </div>
      <blockquote style="margin: 1rem 0; padding: 1rem; background: white; border-left: 3px solid #f39c12; font-style: italic; color: #374151;">
        "${comment}"
      </blockquote>
    </div>
  `;
});

// Gallery Preview
CMS.registerPreviewTemplate('gallery', ({ entry }) => {
  const title = entry.getIn(['data', 'title']);
  const image = entry.getIn(['data', 'src']);
  const category = entry.getIn(['data', 'category']);
  const description = entry.getIn(['data', 'description']);
  
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; padding: 20px;">
      ${image ? `<img src="${image}" alt="${title}" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 1rem;">` : ''}
      <h2 style="color: #0a3d62; margin: 0 0 0.5rem 0;">${title}</h2>
      <p style="color: #666; margin: 0 0 0.5rem 0;">
        <strong>Category:</strong> ${category}
      </p>
      <p style="color: #374151; margin: 0; line-height: 1.6;">
        ${description || 'No description provided'}
      </p>
    </div>
  `;
});

console.log('[ADMIN] Preview templates registered');
