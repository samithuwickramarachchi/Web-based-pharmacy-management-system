/**
 * Utility for providing polished medicine imagery and category visuals
 * without requiring schema alterations to the Product backend entity.
 */

// Specific pharmaceutical and healthcare images mapped by product SKU / key terms
const PRODUCT_SPECIFIC_IMAGES = {
  // Vitamin D3 2000 IU -> Amber bottle with golden softgels & vitamins
  'vit-vitd-2000': 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=600&auto=format&fit=crop&q=80',
  'vitamin d3': 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=600&auto=format&fit=crop&q=80',
  'vitamin d': 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=600&auto=format&fit=crop&q=80',

  // Vitamin C 1000mg Effervescent -> orange vitamin capsule tablets (HTTP 200 verified)
  // Note: photo-1707056637375-359f4089e900 returned HTTP 404 and has been replaced.
  'vit-vitc-1000': 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&auto=format&fit=crop&q=80',
  'vitamin c': 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&auto=format&fit=crop&q=80',
  'effervescent': 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&auto=format&fit=crop&q=80',

  // Paracetamol 500mg -> Analgesic tablets blister pack
  'med-para-500': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80',
  'paracetamol': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80',
  'panadol': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80',

  // Ibuprofen 400mg -> NSAID anti-inflammatory blister pack
  'med-ibup-400': 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&auto=format&fit=crop&q=80',
  'ibuprofen': 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&auto=format&fit=crop&q=80',

  // Amoxicillin 500mg -> Antibiotic capsules blister pack
  'med-amox-500': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
  'amoxicillin': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',

  // Azithromycin 250mg -> Antibiotic tablets blister pack
  'med-azith-250': 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=80',
  'azithromycin': 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=80',

  // Amlodipine 5mg -> Cardiovascular / blood pressure blister pack
  'med-amlo-005': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80',
  'amlodipine': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80',

  // Atorvastatin 20mg -> Statin cardiovascular tablets blister pack
  'med-ator-020': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80',
  'atorvastatin': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80',

  // Cetirizine 10mg -> Allergy / antihistamine tablets
  'med-ceti-010': 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600&auto=format&fit=crop&q=80',
  'cetirizine': 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600&auto=format&fit=crop&q=80',

  // Antiseptic First Aid Spray -> Antiseptic spray bottle / first aid supplies
  'otc-anti-100': 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&auto=format&fit=crop&q=80',
  'antiseptic': 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&auto=format&fit=crop&q=80',
};

// Curated high quality category pharmaceutical photography
const CATEGORY_IMAGE_MAP = {
  'Antibiotics': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
  'Pain Relief & Antipyretics': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80',
  'Pain Relief': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80',
  'Analgesics': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80',
  'Vitamins & Supplements': 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=600&auto=format&fit=crop&q=80',
  'Vitamins': 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=600&auto=format&fit=crop&q=80',
  'Supplements': 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=600&auto=format&fit=crop&q=80',
  'Cardiovascular & Hypertension': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80',
  'Cardiovascular': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80',
  'Cold, Cough & Allergy': 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600&auto=format&fit=crop&q=80',
  'Respiratory': 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600&auto=format&fit=crop&q=80',
  'Personal Care & First Aid': 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&auto=format&fit=crop&q=80',
  'First Aid': 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&auto=format&fit=crop&q=80',
  'Prescription Medicines': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
  'Over-the-Counter (OTC)': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80',
  'OTC': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80',
  'Baby Care': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&auto=format&fit=crop&q=80',
  'Skin Care': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80',
  'Diabetes Care': 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&auto=format&fit=crop&q=80',
  'Digestive Health': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80',
  'Eye & Ear Care': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
};

// Pure pharmaceutical medicine fallback images
const DEFAULT_MEDICINE_IMAGES = [
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80',
];

/**
 * Returns a reliable pharmaceutical image URL for a given product.
 * Ensures inappropriate imagery (e.g. toys/Rubik's cube) is never displayed.
 */
export function getProductImageUrl(product) {
  if (!product) return DEFAULT_MEDICINE_IMAGES[0];

  // If product already has an explicit valid image URL
  // Blacklist: 1577401239170 (Rubik's cube), 1707056637375 (HTTP 404)
  if (
    product.imageUrl &&
    typeof product.imageUrl === 'string' &&
    product.imageUrl.startsWith('http') &&
    !product.imageUrl.includes('1577401239170') &&
    !product.imageUrl.includes('1707056637375')
  ) {
    return product.imageUrl;
  }

  const sku = (product.sku || '').toLowerCase().trim();
  const name = (product.name || '').toLowerCase().trim();

  // 1. Direct SKU match
  if (sku && PRODUCT_SPECIFIC_IMAGES[sku]) {
    return PRODUCT_SPECIFIC_IMAGES[sku];
  }

  // 2. Specific product name match
  for (const [key, imgUrl] of Object.entries(PRODUCT_SPECIFIC_IMAGES)) {
    if (name.includes(key)) {
      return imgUrl;
    }
  }

  // 3. Category match
  const cat = (product.categoryName || '').toLowerCase().trim();
  for (const [categoryKey, imgUrl] of Object.entries(CATEGORY_IMAGE_MAP)) {
    if (cat.includes(categoryKey.toLowerCase())) {
      return imgUrl;
    }
  }

  // 4. Unit / form keyword heuristic
  const unit = (product.unit || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();
  if (name.includes('vitamin') || desc.includes('vitamin') || unit.includes('softgel')) {
    return CATEGORY_IMAGE_MAP['Vitamins & Supplements'];
  }
  if (name.includes('antibiotic') || desc.includes('antibiotic') || unit.includes('capsule')) {
    return CATEGORY_IMAGE_MAP['Antibiotics'];
  }
  if (name.includes('spray') || desc.includes('spray')) {
    return CATEGORY_IMAGE_MAP['Personal Care & First Aid'];
  }

  // 5. Stable hash per product ID fallback (guaranteed pharmaceutical)
  const hash = Math.abs((Number(product.id) || 1) * 31 + sku.length);
  return DEFAULT_MEDICINE_IMAGES[hash % DEFAULT_MEDICINE_IMAGES.length];
}

/**
 * Category color tags for visual styling
 */
export function getCategoryTheme(categoryName) {
  const cat = (categoryName || '').toLowerCase();
  if (cat.includes('pain') || cat.includes('analgesic') || cat.includes('antipyretic')) {
    return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca', label: 'Pain Relief' };
  }
  if (cat.includes('antibiotic')) {
    return { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe', label: 'Antibiotics' };
  }
  if (cat.includes('vitamin') || cat.includes('supplement')) {
    return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0', label: 'Wellness & Vitamins' };
  }
  if (cat.includes('cardio') || cat.includes('heart') || cat.includes('hypertension')) {
    return { bg: '#fdf2f8', text: '#9d174d', border: '#fbcfe8', label: 'Heart Health' };
  }
  if (cat.includes('respiratory') || cat.includes('cough') || cat.includes('allergy') || cat.includes('cold')) {
    return { bg: '#f0fdfa', text: '#0f766e', border: '#99f6e4', label: 'Respiratory & Allergy' };
  }
  if (cat.includes('first aid') || cat.includes('personal care')) {
    return { bg: '#fff7ed', text: '#c2410c', border: '#ffedd5', label: 'First Aid & Care' };
  }
  return { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1', label: categoryName || 'Pharmacy' };
}

export default {
  getProductImageUrl,
  getCategoryTheme,
};
