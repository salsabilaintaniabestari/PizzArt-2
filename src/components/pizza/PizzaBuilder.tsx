import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Pizza, Topping } from '../../types';
import { baseSauces, pizzaSizes, availableToppings as defaultToppings } from '../../data/toppings';
import PizzaPreview from './PizzaPreview';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface PizzaBuilderProps {
  onPizzaComplete: (pizza: Pizza) => void;
}

const PizzaBuilder: React.FC<PizzaBuilderProps> = ({ onPizzaComplete }) => {
  const [pizzaName, setPizzaName] = useState('');
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [selectedSauce, setSelectedSauce] = useState('tomato');
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [availableToppings, setAvailableToppings] = useState<Topping[]>([]);
  const [availableSauces, setAvailableSauces] = useState<typeof baseSauces>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  // Helper function untuk normalize string (lowercase, remove spaces dan karakter khusus)
  const normalizeString = (str: string): string => {
    return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  };

  // Helper function untuk matching yang lebih fleksibel
  const isMatch = (inventoryName: string, toppingName: string): boolean => {
    const invNormalized = normalizeString(inventoryName);
    const topNormalized = normalizeString(toppingName);
    
    // Exact match setelah normalisasi
    if (invNormalized === topNormalized) return true;
    
    // Check jika salah satu mengandung yang lain
    if (invNormalized.includes(topNormalized) || topNormalized.includes(invNormalized)) return true;
    
    // Extract kata-kata penting (skip kata umum seperti 'cheese', 'fresh', 'extra')
    const skipWords = ['cheese', 'fresh', 'extra', 'special', 'premium', 'crispy', 'grilled', 'smoked'];
    
    const invWords = inventoryName.toLowerCase().split(' ').filter(w => !skipWords.includes(w));
    const topWords = toppingName.toLowerCase().split(' ').filter(w => !skipWords.includes(w));
    
    // Check jika ada kata kunci yang sama
    for (const invWord of invWords) {
      for (const topWord of topWords) {
        if (invWord.length > 2 && topWord.length > 2) {
          if (invWord.includes(topWord) || topWord.includes(invWord)) {
            return true;
          }
        }
      }
    }
    
    return false;
  };

  const loadInventory = async () => {
    try {
      const inventoryQuery = query(
        collection(db, 'inventory'), 
        where('is_available', '==', true)
      );
      const inventorySnapshot = await getDocs(inventoryQuery);
      const inventory = inventorySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('=== INVENTORY LOADING DEBUG ===');
      console.log('Available inventory items:', inventory);
      console.log('Total inventory items:', inventory.length);

      // Jika tidak ada inventory atau inventory kosong, gunakan semua toppings
      if (inventory.length === 0) {
        console.log('No inventory found, using all default toppings');
        setAvailableToppings(defaultToppings);
        setAvailableSauces(baseSauces);
        setSelectedSauce(baseSauces[0].id);
        setIsLoading(false);
        return;
      }

      console.log('Inventory items:', inventory.map(i => i.name));

      // Match toppings with inventory using improved matching logic
      const toppingsFromInventory: Topping[] = [];

      defaultToppings.forEach(topping => {
        // Check berbagai variasi nama
        const variations = [
          topping.name,
          topping.name.replace('Extra ', ''),
          topping.name.replace('Sharp ', ''),
          topping.name.replace('Goat ', ''),
          topping.name.replace('Fresh ', ''),
          topping.name.replace('Crispy ', ''),
          topping.name.replace('Grilled ', ''),
          topping.name.replace('Smoked ', ''),
          topping.id,
        ];

        let matched = false;
        for (const inventoryItem of inventory) {
          for (const variation of variations) {
            if (isMatch(inventoryItem.name, variation)) {
              console.log(`✓ Matched: "${topping.name}" with inventory "${inventoryItem.name}"`);
              toppingsFromInventory.push(topping);
              matched = true;
              break;
            }
          }
          if (matched) break;
        }

        if (!matched) {
          console.log(`✗ Not matched: "${topping.name}"`);
        }
      });

      console.log('Total toppings matched:', toppingsFromInventory.length);
      console.log('Matched toppings:', toppingsFromInventory.map(t => t.name));

      // Jika matching terlalu sedikit (< 5), gunakan semua toppings sebagai fallback
      if (toppingsFromInventory.length < 5) {
        console.log('Too few matches, using all default toppings as fallback');
        setAvailableToppings(defaultToppings);
      } else {
        setAvailableToppings(toppingsFromInventory);
      }

      // Match sauces
      const saucesFromInventory = baseSauces.filter(sauce => {
        const variations = [
          sauce.name,
          sauce.name.toLowerCase(),
          sauce.id,
        ];
        
        for (const inventoryItem of inventory) {
          for (const variation of variations) {
            if (isMatch(inventoryItem.name, variation)) {
              console.log(`✓ Matched sauce: "${sauce.name}" with inventory "${inventoryItem.name}"`);
              return true;
            }
          }
        }
        return false;
      });

      console.log('Matched sauces:', saucesFromInventory.map(s => s.name));
      setAvailableSauces(saucesFromInventory.length > 0 ? saucesFromInventory : baseSauces);

      // Set default sauce selection
      if (saucesFromInventory.length > 0) {
        setSelectedSauce(saucesFromInventory[0].id);
      } else {
        setSelectedSauce(baseSauces[0].id);
      }

      console.log('=== INVENTORY LOADING COMPLETE ===');
    } catch (error) {
      console.error('Error loading inventory:', error);
      // Fallback to all items on error
      setAvailableToppings(defaultToppings);
      setAvailableSauces(baseSauces);
      setSelectedSauce(baseSauces[0].id);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTopping = (topping: Topping) => {
    setSelectedToppings(prev => {
      const exists = prev.find(t => t.id === topping.id);
      if (exists) {
        return prev.filter(t => t.id !== topping.id);
      } else {
        return [...prev, topping];
      }
    });
  };

  const calculatePrice = () => {
    const sizePrice = pizzaSizes.find(s => s.id === selectedSize)?.basePrice || 0;
    const saucePrice = availableSauces.find(s => s.id === selectedSauce)?.price || 0;
    const toppingsPrice = selectedToppings.reduce((total, topping) => total + topping.price, 0);

    return sizePrice + saucePrice + toppingsPrice;
  };

  const handleComplete = () => {
    if (!pizzaName.trim()) {
      alert('Berikan nama untuk pizza kreasi kamu!');
      return;
    }

    const pizza: Pizza = {
      id: Date.now().toString(),
      name: pizzaName,
      size: selectedSize,
      sauce: selectedSauce,
      toppings: selectedToppings,
      price: calculatePrice(),
      likes: 0,
    };

    onPizzaComplete(pizza);
  };

  const toppingsByCategory = {
    meat: availableToppings.filter(t => t.category === 'meat'),
    vegetable: availableToppings.filter(t => t.category === 'vegetable'),
    cheese: availableToppings.filter(t => t.category === 'cheese'),
    sauce: availableToppings.filter(t => t.category === 'sauce'),
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-yellow-100 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Memuat bahan yang tersedia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-yellow-100 to-red-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-2">
            Buat Pizza Impianmu
          </h1>
          <p className="text-gray-600 text-lg">Kreativitas tanpa batas, rasa tak terbatas</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Preview Pizza (Sticky) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-xl sticky top-4">
              <h2 className="text-xl font-bold text-center mb-4 text-gray-800">Preview Pizza</h2>
              <PizzaPreview
                size={selectedSize}
                sauce={selectedSauce}
                toppings={selectedToppings}
              />

              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Pizza Kamu
                </label>
                <input
                  type="text"
                  value={pizzaName}
                  onChange={(e) => setPizzaName(e.target.value)}
                  placeholder="Contoh: Dragon Fire Special"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div className="mt-6">
                <div className="bg-gradient-to-r from-yellow-400 to-red-500 text-white p-4 rounded-2xl mb-4 text-center">
                  <p className="text-xs opacity-90">Total Harga</p>
                  <p className="text-3xl font-bold">Rp {calculatePrice().toLocaleString()}</p>
                </div>

                <button
                  onClick={handleComplete}
                  disabled={!pizzaName.trim()}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-2xl font-bold hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <Sparkles size={20} />
                  <span>Tambahkan ke Keranjang</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Options (Scrollable) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pilih Ukuran */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">🍕</span>
                Pilih Ukuran
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pizzaSizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.id as any)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      selectedSize === size.id
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <div className="font-bold text-base">{size.name}</div>
                    <div className="text-sm text-gray-600 mt-1">Rp {size.basePrice.toLocaleString()}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Pilih Saus */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">🥫</span>
                Pilih Saus Base
              </h3>
              {availableSauces.length === 0 ? (
                <p className="text-gray-500 text-center py-3 text-sm">Tidak ada saus tersedia</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableSauces.map((sauce) => (
                    <button
                      key={sauce.id}
                      onClick={() => setSelectedSauce(sauce.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        selectedSauce === sauce.id
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <div className="font-bold text-sm">{sauce.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {sauce.price > 0 ? `+Rp ${sauce.price.toLocaleString()}` : 'Gratis'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Topping Daging */}
            {toppingsByCategory.meat.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🥩</span>
                  Daging ({toppingsByCategory.meat.length} pilihan)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {toppingsByCategory.meat.map((topping) => {
                    const isSelected = selectedToppings.find(t => t.id === topping.id);
                    return (
                      <button
                        key={topping.id}
                        onClick={() => toggleTopping(topping)}
                        className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 text-center ${
                          isSelected
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-red-300'
                        }`}
                      >
                        <div className="text-3xl mb-2">{topping.image}</div>
                        <div className="font-bold text-sm">{topping.name}</div>
                        <div className="text-xs text-gray-600 mt-1">+Rp {topping.price.toLocaleString()}</div>
                        {isSelected && (
                          <div className="text-green-600 mt-2 font-semibold text-xs">✓ Dipilih</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Topping Sayuran */}
            {toppingsByCategory.vegetable.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🥬</span>
                  Sayuran ({toppingsByCategory.vegetable.length} pilihan)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {toppingsByCategory.vegetable.map((topping) => {
                    const isSelected = selectedToppings.find(t => t.id === topping.id);
                    return (
                      <button
                        key={topping.id}
                        onClick={() => toggleTopping(topping)}
                        className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 text-center ${
                          isSelected
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-red-300'
                        }`}
                      >
                        <div className="text-3xl mb-2">{topping.image}</div>
                        <div className="font-bold text-sm">{topping.name}</div>
                        <div className="text-xs text-gray-600 mt-1">+Rp {topping.price.toLocaleString()}</div>
                        {isSelected && (
                          <div className="text-green-600 mt-2 font-semibold text-xs">✓ Dipilih</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Topping Keju */}
            {toppingsByCategory.cheese.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🧀</span>
                  Keju ({toppingsByCategory.cheese.length} pilihan)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {toppingsByCategory.cheese.map((topping) => {
                    const isSelected = selectedToppings.find(t => t.id === topping.id);
                    return (
                      <button
                        key={topping.id}
                        onClick={() => toggleTopping(topping)}
                        className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 text-center ${
                          isSelected
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-red-300'
                        }`}
                      >
                        <div className="text-3xl mb-2">{topping.image}</div>
                        <div className="font-bold text-sm">{topping.name}</div>
                        <div className="text-xs text-gray-600 mt-1">+Rp {topping.price.toLocaleString()}</div>
                        {isSelected && (
                          <div className="text-green-600 mt-2 font-semibold text-xs">✓ Dipilih</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Saus Spesial */}
            {toppingsByCategory.sauce.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🌶️</span>
                  Saus Spesial ({toppingsByCategory.sauce.length} pilihan)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {toppingsByCategory.sauce.map((topping) => {
                    const isSelected = selectedToppings.find(t => t.id === topping.id);
                    return (
                      <button
                        key={topping.id}
                        onClick={() => toggleTopping(topping)}
                        className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 text-center ${
                          isSelected
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-red-300'
                        }`}
                      >
                        <div className="text-3xl mb-2">{topping.image}</div>
                        <div className="font-bold text-sm">{topping.name}</div>
                        <div className="text-xs text-gray-600 mt-1">+Rp {topping.price.toLocaleString()}</div>
                        {isSelected && (
                          <div className="text-green-600 mt-2 font-semibold text-xs">✓ Dipilih</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PizzaBuilder;