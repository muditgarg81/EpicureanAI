import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../store/useAppStore';
import useTranslation from '../hooks/useTranslation';
import TopAppBar from '../components/TopAppBar';
import { getDishImage, isStrictDishImage } from '../data/culinaryData';
import { getDishImageWaterfall } from '../services/imageWaterfallService';

const FavoriteCard = ({ recipe, index, onClick, onToggleSave }) => {
  const [unsplashImage, setUnsplashImage] = React.useState(null);

  const isRealImage = recipe.img && isStrictDishImage(recipe.img) && !recipe.img.includes('/assets/');

  React.useEffect(() => {
    const fetchImg = async () => {
      if (isRealImage) return; // Skip if we have Wikipedia/DB image
      const title = recipe.title || recipe.dish_name;
      if (title) {
        const img = await getDishImageWaterfall(title);
        if (img) setUnsplashImage(img);
      }
    };
    fetchImg();
  }, [recipe.title, recipe.dish_name, isRealImage]);

  const displayImage = isRealImage ? recipe.img : (unsplashImage || recipe.img);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -6 }}
      className="bg-surface-container-low border border-outline-variant/30 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col relative group cursor-pointer"
      onClick={() => onClick(recipe)}
    >
      {/* Heart Toggle Badge */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleSave(recipe);
        }}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-surface/80 backdrop-blur-md flex items-center justify-center shadow-md hover:scale-110 active:scale-90 transition-all text-error"
        title="Remove from favorites"
      >
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          favorite
        </span>
      </button>

      {/* Recipe Cover Image */}
      <div className="h-44 overflow-hidden relative bg-gradient-to-br from-primary/30 to-tertiary/30 flex items-center justify-center">
        {(!displayImage || displayImage.includes('loremflickr.com')) ? (
          <span className="text-on-surface text-6xl font-bold opacity-30 uppercase tracking-widest absolute">
            {(recipe.title || 'R').charAt(0)}
          </span>
        ) : (
          <img 
            src={displayImage}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 absolute inset-0"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60"></div>
      </div>

      {/* Recipe Info */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-secondary font-bold block mb-1">
            {recipe.description || "AI Optimized"}
          </span>
          <h4 className="font-headline-sm text-headline-sm text-on-surface line-clamp-1 mb-2">
            {recipe.title}
          </h4>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-outline-variant/10 text-on-surface-variant">
          <div className="flex items-center gap-1 text-[12px]">
            <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
            <span>{recipe.prepTime || recipe.time || "35 min"}</span>
          </div>
          <div className="flex items-center gap-1 text-[12px]">
            <span className="material-symbols-outlined text-[16px] text-primary">local_fire_department</span>
            <span>{recipe.calories || 450} cal</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Favorites = () => {
  const { savedRecipes, toggleSaveRecipe } = useAppStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleCardClick = (recipe) => {
    navigate('/recipe', { state: { recipe } });
  };

  return (
    <div className="min-h-screen bg-background text-on-surface pb-32">
      <TopAppBar title={t('favorites') || "Saved Recipes"} />
      
      <main className="pt-24 px-container-margin max-w-7xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary dark:text-primary-fixed">
              {t('favorites') || "Saved Recipes"}
            </h2>
            <p className="text-body-md text-on-surface-variant mt-1">
              Your handpicked collection of delicious meals and custom AI creations.
            </p>
          </div>
          <span className="font-label-lg text-label-lg bg-primary-container text-on-primary-container px-4 py-2 rounded-full shadow-sm">
            {savedRecipes.length} {savedRecipes.length === 1 ? 'Recipe' : 'Recipes'}
          </span>
        </header>

        <AnimatePresence mode="wait">
          {savedRecipes.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center text-center py-20 px-6 bg-surface-container-low border border-dashed border-outline-variant/50 rounded-[2.5rem]"
            >
              <div className="w-24 h-24 rounded-full bg-error/10 text-error flex items-center justify-center mb-6 shadow-inner animate-pulse">
                <span className="material-symbols-outlined !text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Your Recipe Book is Empty</h3>
              <p className="text-body-lg text-on-surface-variant max-w-md mb-8">
                Explore authentic global dishes and heart your favorite creations to save them here for offline access and quick cooking!
              </p>
              <button 
                onClick={() => navigate('/discovery')}
                className="bg-primary text-on-primary hover:bg-primary/95 px-8 py-4 rounded-2xl font-label-lg text-label-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2"
              >
                <span className="material-symbols-outlined">explore</span>
                Explore Culinary Dishes
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter"
            >
              {savedRecipes.map((recipe, index) => (
                <FavoriteCard 
                  key={recipe.title + index}
                  recipe={recipe}
                  index={index}
                  onClick={handleCardClick}
                  onToggleSave={toggleSaveRecipe}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Favorites;
