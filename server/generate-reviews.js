import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./database.sqlite');

// Custom promisified run that returns lastID
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Trait categories and options
const traitCategories = {
  management: ['Responsive Management', 'Poor Management', 'Professional Staff'],
  maintenance: ['Quick Maintenance', 'Slow Maintenance', 'Poor Maintenance'],
  location: ['Close to Campus', 'Public Transit', 'Safe Area', 'Walkable'],
  amenities: ['Parking', 'Laundry', 'Fitness Center', 'Pet Friendly', 'Pool', 'Balcony', 'Elevator'],
  building: ['Quiet', 'Noisy', 'Clean', 'Modern', 'Updated', 'Outdated'],
  utilities: ['Utilities Included', 'High Utilities', 'Energy Efficient'],
  space: ['Spacious', 'Small Units', 'Good Storage'],
  features: ['Washer/Dryer', 'Dishwasher', 'Air Conditioning', 'Furnished', 'Hardwood Floors']
};

// Define apartment configurations - each listing will use one of these consistently
const apartmentConfigs = [
  { bedrooms: 1, bathrooms: 1, basePrice: 900, priceRange: 100 },
  { bedrooms: 1, bathrooms: 1, basePrice: 1100, priceRange: 150 },
  { bedrooms: 2, bathrooms: 1, basePrice: 1300, priceRange: 200 },
  { bedrooms: 2, bathrooms: 1.5, basePrice: 1500, priceRange: 200 },
  { bedrooms: 2, bathrooms: 2, basePrice: 1700, priceRange: 250 },
  { bedrooms: 3, bathrooms: 2, basePrice: 2000, priceRange: 300 },
  { bedrooms: 'Studio', bathrooms: 1, basePrice: 850, priceRange: 100 },
];

// Review templates with ratings
const reviewTemplates = [
  { rating: 5, texts: [
    "Absolutely love living here! The {trait1} and {trait2} make it perfect. Management is {management} and everything works great.",
    "Best apartment I've had in Eugene. The {trait1} is amazing and {trait2} is a huge plus. Would definitely recommend!",
    "Five stars! The {trait1} exceeded my expectations. {trait2} and {management} staff make this place outstanding.",
    "Couldn't be happier with my choice. {trait1} and {trait2} are exactly what I needed. The {management} team is wonderful.",
    "Perfect location! {trait1} is great, and I love the {trait2}. Maintenance is {maintenance} which is rare to find."
  ]},
  { rating: 4, texts: [
    "Really good apartment overall. The {trait1} is nice and {trait2} works well. {management} could be a bit better but still solid.",
    "Happy with my choice. {trait1} is great, {trait2} is convenient. Only minor issue is {negative} but manageable.",
    "Good value for the price. {trait1} and {trait2} are both solid. {management} team does their job well.",
    "Enjoying my time here. {trait1} is excellent and {trait2} is helpful. Sometimes {negative} but overall positive.",
    "Would recommend! {trait1} makes life easier and {trait2} is a bonus. {maintenance} is usually quick."
  ]},
  { rating: 3, texts: [
    "Decent place, nothing special. {trait1} is okay but {negative}. Price is fair for what you get.",
    "It's alright. {trait1} is the main positive, but {negative} and {management} could improve.",
    "Average apartment. {trait1} is nice but {negative} which can be annoying. {maintenance} is hit or miss.",
    "Gets the job done. {trait1} works for me, though {negative}. Good enough for student housing.",
    "Mixed feelings. {trait1} is good but {negative}. {management} is slow to respond sometimes."
  ]},
  { rating: 2, texts: [
    "Not great. {negative} is a real problem and {management} doesn't seem to care. {trait1} is the only redeeming quality.",
    "Disappointed. {negative} constantly and {maintenance} takes forever. Would not renew my lease.",
    "Below expectations. {negative} and {management} is unresponsive. Only staying because {trait1}.",
    "Frustrating experience. {negative} and {maintenance} never seems to fix things properly.",
    "Would not recommend. {negative} is a major issue. {management} needs serious improvement."
  ]},
  { rating: 1, texts: [
    "Terrible experience. {negative} constantly, {management} ignores complaints. Avoid this place!",
    "Worst apartment I've lived in. {negative} and {maintenance} is non-existent. Looking to move ASAP.",
    "Do not rent here! {negative} and {management} is awful. Save yourself the headache.",
    "One star is generous. {negative} all the time and {maintenance} never responds. Complete disaster.",
    "Absolutely awful. {negative} and {management} couldn't care less. Moving out as soon as possible."
  ]}
];

const managementDescriptors = {
  5: ['amazing', 'excellent', 'very responsive', 'professional', 'fantastic'],
  4: ['good', 'helpful', 'responsive', 'decent', 'friendly'],
  3: ['okay', 'average', 'sometimes helpful', 'hit or miss', 'acceptable'],
  2: ['slow', 'unresponsive', 'poor', 'unhelpful', 'lacking'],
  1: ['terrible', 'non-existent', 'awful', 'incompetent', 'useless']
};

const maintenanceDescriptors = {
  5: ['extremely quick', 'always on time', 'excellent', 'very fast', 'impressive'],
  4: ['pretty quick', 'usually fast', 'good', 'reliable', 'responsive'],
  3: ['average', 'okay', 'variable', 'sometimes slow', 'hit or miss'],
  2: ['slow', 'delayed', 'poor', 'takes too long', 'frustrating'],
  1: ['never responds', 'terrible', 'non-existent', 'worst ever', 'useless']
};

const negativeIssues = [
  'the walls are thin',
  'parking is limited',
  'it can be noisy at times',
  'utilities are expensive',
  'the units are a bit small',
  'the building is older',
  'there are occasional issues',
  'rent increased recently',
  'the elevator breaks down',
  'lack of storage space'
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomTraits(count = 3) {
  const allTraits = Object.values(traitCategories).flat();
  const selected = [];
  while (selected.length < count) {
    const trait = getRandomElement(allTraits);
    if (!selected.includes(trait)) {
      selected.push(trait);
    }
  }
  return selected;
}

function generateReviewText(rating, traits) {
  const template = getRandomElement(reviewTemplates.find(t => t.rating === rating).texts);
  const management = getRandomElement(managementDescriptors[rating]);
  const maintenance = getRandomElement(maintenanceDescriptors[rating]);
  const negative = getRandomElement(negativeIssues);
  
  return template
    .replace('{trait1}', traits[0].toLowerCase())
    .replace('{trait2}', traits[1] ? traits[1].toLowerCase() : traits[0].toLowerCase())
    .replace('{management}', management)
    .replace('{maintenance}', maintenance)
    .replace('{negative}', negative);
}

function getRandomDate() {
  const start = new Date(2024, 0, 1);
  const end = new Date(2025, 10, 16);
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString();
}

async function generateReviews() {
  try {
    // Get all listings
    const listings = await dbAll('SELECT id, name FROM listings ORDER BY id');
    console.log(`Found ${listings.length} listings\n`);

    // Get all users
    const users = await dbAll('SELECT id FROM users');
    console.log(`Found ${users.length} users\n`);

    let totalReviewsCreated = 0;

    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
      
      // Check if listing already has 5 or more reviews
      const existingReviews = await dbAll(
        'SELECT COUNT(*) as count FROM reviews WHERE listing_id = ?',
        [listing.id]
      );
      
      if (existingReviews[0].count >= 5) {
        console.log(`${listing.name} already has ${existingReviews[0].count} reviews, skipping...`);
        continue;
      }

      // Assign a consistent apartment configuration for this listing
      const config = apartmentConfigs[i % apartmentConfigs.length];
      
      // Select consistent traits for this listing (3-5 traits)
      const traitCount = 3 + Math.floor(Math.random() * 3);
      const listingTraits = getRandomTraits(traitCount);
      
      console.log(`Generating 5 reviews for: ${listing.name}`);
      console.log(`  Config: ${config.bedrooms} bed, ${config.bathrooms} bath, ~$${config.basePrice}`);
      console.log(`  Traits: ${listingTraits.join(', ')}\n`);

      // Generate 5 reviews with varying ratings
      const ratingValues = [5, 4, 4, 3, 2]; // Mix of ratings
      ratingValues.sort(() => Math.random() - 0.5); // Shuffle

      for (let j = 0; j < 5; j++) {
        const ratingValue = ratingValues[j];
        const reviewText = generateReviewText(ratingValue, listingTraits);
        const price = config.basePrice + Math.floor(Math.random() * config.priceRange);
        const createdAt = getRandomDate();
        const userId = getRandomElement(users).id;

        // Insert review
        const reviewResult = await dbRun(
          `INSERT INTO reviews (listing_id, user_id, text, bedrooms, bathrooms, rent_price, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [listing.id, userId, reviewText, config.bedrooms, config.bathrooms, price, createdAt]
        );

        const reviewId = reviewResult.lastID;

        // Insert rating
        await dbRun(
          'INSERT INTO ratings (review_id, rating) VALUES (?, ?)',
          [reviewId, ratingValue]
        );

        // Insert traits for this review (use 2-3 of the listing's traits)
        const reviewTraitCount = 2 + Math.floor(Math.random() * 2);
        const reviewTraits = listingTraits.slice(0, reviewTraitCount);
        
        for (const trait of reviewTraits) {
          await dbRun(
            'INSERT INTO review_traits (review_id, trait) VALUES (?, ?)',
            [reviewId, trait]
          );
        }

        totalReviewsCreated++;
        console.log(`  ✓ Review ${j + 1}: ${ratingValue} stars, ${reviewTraits.join(', ')}`);
      }
      console.log('');
    }

    console.log(`\n✅ Successfully created ${totalReviewsCreated} reviews!`);
    
  } catch (error) {
    console.error('Error generating reviews:', error);
  } finally {
    db.close();
  }
}

generateReviews();
