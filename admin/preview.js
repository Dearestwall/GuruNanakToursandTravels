// Custom preview templates for Netlify CMS
import CMS from 'netlify-cms-app';

// Tour preview template
const TourPreview = ({ entry, widgetFor }) => {
  const title = entry.getIn(['data', 'title']);
  const image = entry.getIn(['data', 'image']);
  const price = entry.getIn(['data', 'price']);
  const duration = entry.getIn(['data', 'duration']);
  
  return (
    <div style={{ 
      fontFamily: 'system-ui, -apple-system, sans-serif', 
      padding: '20px',
      background: '#f5f5f5'
    }}>
      <h1>{title}</h1>
      {image && <img src={image} alt={title} style={{ maxWidth: '100%', height: 'auto' }} />}
      <div style={{ marginTop: '20px' }}>
        <p><strong>Duration:</strong> {duration?.days} Days / {duration?.nights} Nights</p>
        <p><strong>Price:</strong> ₹{price}</p>
      </div>
      <div style={{ marginTop: '20px' }}>
        {widgetFor('description')}
      </div>
    </div>
  );
};

// Register preview
CMS.registerPreviewTemplate('tours', TourPreview);

// Blog preview template
const BlogPreview = ({ entry, widgetFor }) => {
  return (
    <div style={{ 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      background: 'white'
    }}>
      <h1>{entry.getIn(['data', 'title'])}</h1>
      <small>{entry.getIn(['data', 'date'])}</small>
      {entry.getIn(['data', 'image']) && (
        <img 
          src={entry.getIn(['data', 'image'])} 
          alt={entry.getIn(['data', 'title'])}
          style={{ maxWidth: '100%', height: 'auto', marginTop: '20px' }}
        />
      )}
      <div style={{ marginTop: '20px' }}>
        {widgetFor('body')}
      </div>
    </div>
  );
};

CMS.registerPreviewTemplate('blog', BlogPreview);
