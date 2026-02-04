import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import productService from '../../services/productService';
import { Product, ProductVariation, Review } from '../../types';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import Toast from 'react-native-toast-message';
import ProductCard from '../../components/products/ProductCard';
import VariationSelector from '../../components/products/VariationSelector';
import IndianRupeeIcon from '../../components/products/IndianRupeeIcon';
import ArrowLeftIcon from '../../components/icons/ArrowLeftIcon';
import CartIcon from '../../components/icons/CartIcon';
import HeartIcon from '../../components/icons/HeartIcon';
import SearchIcon from '../../components/icons/SearchIcon';

type ProductDetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;
type ProductDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProductDetail'>;

const { width } = Dimensions.get('window');
const CAROUSEL_WIDTH = width;
const PRODUCT_ITEM_HEIGHT = 320;
const MAX_PRODUCTS = 10;
const STITCHING_COST = 35;

// Memoized Review Card
const ReviewCard = memo(({ review }: { review: Review }) => (
  <View style={styles.reviewItem}>
    <View style={styles.reviewHeader}>
      <Text style={styles.reviewAuthor}>{review.reviewer}</Text>
      <Text style={styles.reviewStars}>
        {'⭐'.repeat(review.rating)}
      </Text>
    </View>
    <Text style={styles.reviewText}>{review.review}</Text>
    <Text style={styles.reviewDate}>
      {new Date(review.date_created).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })}
    </Text>
    {review.verified && (
      <View style={styles.verifiedBadge}>
        <Text style={styles.verifiedText}>✓ Verified Purchase</Text>
      </View>
    )}
  </View>
));

export default function ProductDetailScreen() {
  const route = useRoute<ProductDetailRouteProp>();
  const navigation = useNavigation<ProductDetailNavigationProp>();
  const { productId } = route.params;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedAttributes, setSelectedAttributes] = useState<{ [key: string]: string }>({});
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [isStitched, setIsStitched] = useState(false);
  const [imageHeight, setImageHeight] = useState(400);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    reviewer: '',
    reviewer_email: '',
    review: '',
    rating: 5,
  });
  
  const scrollViewRef = useRef<ScrollView>(null);
  const flatListRef = useRef<FlatList>(null);
  const loadingRef = useRef(false);
  const { addItem, getItemQuantity, itemCount } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();

  const toggleWishlist = (item: Product | null = product) => {
    // Safety check: ensure item is a valid product object, not an event or other object
    if (!item || !item.id || typeof item.id !== 'number') return;
    
    if (isInWishlist(item.id)) {
      removeFromWishlist(item.id);
      Toast.show({
        type: 'success',
        text1: 'Removed from wishlist',
      });
    } else {
      addToWishlist(item);
      Toast.show({
        type: 'success',
        text1: 'Added to wishlist',
      });
    }
  };

  const currentImages = React.useMemo(() => {
    if (!product) return [];
    
    if (selectedVariation?.image) {
      const variationImageExists = product.images?.some(
        img => img.id === selectedVariation.image.id
      );
      
      if (variationImageExists) {
        return product.images || [];
      } else {
        return [selectedVariation.image, ...(product.images || [])];
      }
    }
    return product.images || [];
  }, [selectedVariation, product]);

  useEffect(() => {
    loadProduct();
    return () => {
      loadingRef.current = false;
    };
  }, [productId]);

  useEffect(() => {
    if (currentImages.length > 0 && currentImages[0]?.src) {
      Image.getSize(
        currentImages[0].src,
        (imgWidth, imgHeight) => {
          const aspectRatio = imgHeight / imgWidth;
          const calculatedHeight = width * aspectRatio;
          setImageHeight(Math.min(calculatedHeight, width * 1.5));
        },
        (error) => {
          setImageHeight(width * 1.2);
        }
      );
    }
  }, [currentImages]);

  // ... (rest of methods)
  
  // ... (inside renderItem replacement in next step, but I can't split function logic easily without context. 
  // I will just update the toggleWishlist definition here.)

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await productService.getProductById(productId);
      setProduct(response.data);
      
      if (response.data.type === 'variable' && response.data.variations.length > 0) {
        const variationsResponse = await productService.getProductVariations(productId);
        const fetchedVariations = variationsResponse.data || [];
        setVariations(fetchedVariations);

        // Auto-select attributes with single option
        if (response.data.attributes) {
          const defaultAttributes: { [key: string]: string } = {};
          response.data.attributes.forEach((attr: any) => {
            if (attr.options.length === 1) {
              defaultAttributes[attr.name] = attr.options[0];
            }
          });

          if (Object.keys(defaultAttributes).length > 0) {
            setSelectedAttributes(prev => {
              const newAttrs = { ...prev, ...defaultAttributes };
              
              // Try to find matching variation
              const matchingVariation = fetchedVariations.find((variation: ProductVariation) => {
                return variation.attributes.every((attr: any) => {
                  return newAttrs[attr.name] === attr.option;
                });
              });
              
              if (matchingVariation) {
                setSelectedVariation(matchingVariation);
                if (matchingVariation.image) {
                    setCurrentImageIndex(0);
                }
              }
              
              return newAttrs;
            });
          }
        }
      }
      
      loadInitialProducts(response.data.id, response.data.categories?.[0]?.id);
      loadReviews(productId);
    } catch (error: any) {
      console.error('Error loading product:', error.message || 'Unknown error');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load product',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async (prodId: number) => {
    try {
      setLoadingReviews(true);
      const response = await productService.getProductReviews(prodId, 1, 10);
      setReviews(response.data || []);
    } catch (error: any) {
      console.error('Error loading reviews:', error.message || 'Unknown error');
    } finally {
      setLoadingReviews(false);
    }
  };

  const submitReview = async () => {
    if (!product) return;
    
    if (!reviewForm.reviewer || !reviewForm.reviewer_email || !reviewForm.review) {
      Toast.show({
        type: 'error',
        text1: 'Missing Fields',
        text2: 'Please fill all required fields',
      });
      return;
    }

    try {
      setSubmittingReview(true);
      // Call your API to submit review
      // await productService.submitReview(product.id, reviewForm);
      
      Toast.show({
        type: 'success',
        text1: 'Review Submitted',
        text2: 'Thank you for your feedback!',
      });
      
      setShowReviewForm(false);
      setReviewForm({
        reviewer: '',
        reviewer_email: '',
        review: '',
        rating: 5,
      });
      
      // Reload reviews
      loadReviews(product.id);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to submit review',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const loadInitialProducts = async (excludeId: number, categoryId?: number) => {
    try {
      let products: Product[] = [];
      
      if (categoryId) {
        const response = await productService.getProducts({ 
          category: categoryId.toString(), 
          per_page: 10 
        });
        products = response.data.filter((p: Product) => p.id !== excludeId);
      }
      
      if (products.length < 10) {
        const generalResponse = await productService.getProducts({ 
          page: 1, 
          per_page: 10 
        });
        const generalProducts = generalResponse.data.filter((p: Product) => 
          p.id !== excludeId && !products.some(sp => sp.id === p.id)
        );
        products = [...products, ...generalProducts].slice(0, 10);
      }
      
      setAllProducts(products);
      setCurrentPage(1);
      setHasMore(products.length >= 10 && products.length < MAX_PRODUCTS);
    } catch (error) {
      console.error('Error loading initial products:', error);
    }
  };

  const loadMoreProducts = useCallback(async () => {
    if (loadingRef.current || !hasMore || !product || allProducts.length >= MAX_PRODUCTS) {
      if (allProducts.length >= MAX_PRODUCTS) {
        setHasMore(false);
      }
      return;
    }
    
    loadingRef.current = true;
    setLoadingMore(true);
    
    try {
      const nextPage = currentPage + 1;
      const response = await productService.getProducts({ 
        page: nextPage, 
        per_page: 10 
      });
      
      const filtered = response.data.filter((p: Product) => 
        p.id !== product.id && 
        !allProducts.some(ap => ap.id === p.id)
      );
      
      const remainingSlots = MAX_PRODUCTS - allProducts.length;
      const productsToAdd = filtered.slice(0, remainingSlots);
      
      if (productsToAdd.length === 0 || response.data.length < 10 || allProducts.length + productsToAdd.length >= MAX_PRODUCTS) {
        setHasMore(false);
      }
      
      if (productsToAdd.length > 0) {
        setAllProducts(prev => {
             const existingIds = new Set(prev.map(p => p.id));
             const uniqueToAdd = productsToAdd.filter(p => !existingIds.has(p.id));
             return [...prev, ...uniqueToAdd];
        });
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, [currentPage, hasMore, product, allProducts, MAX_PRODUCTS]);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CAROUSEL_WIDTH);
    setCurrentImageIndex(index);
  };

  const handleAttributeSelect = (attributeName: string, option: string) => {
    const newSelection = { ...selectedAttributes, [attributeName]: option };
    setSelectedAttributes(newSelection);

    const matchingVariation = variations.find(variation => {
      return variation.attributes.every(attr => {
        return newSelection[attr.name] === attr.option;
      });
    });

    setSelectedVariation(matchingVariation || null);

    if (matchingVariation?.image) {
      setCurrentImageIndex(0);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (product.type === 'variable' && !selectedVariation) {
      Toast.show({
        type: 'error',
        text1: 'Please select options',
        text2: 'Choose size, color, or other options',
      });
      return;
    }

    const success = addItem(product, 1, selectedVariation?.id, selectedAttributes, isStitched);
    
    if (success) {
      Toast.show({
        type: 'success',
        text1: 'Added to cart',
        text2: `${product.name} ${isStitched ? '+ Stitching' : ''} added successfully`,
      });
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    
    if (product.type === 'variable' && !selectedVariation) {
      Toast.show({
        type: 'error',
        text1: 'Please select options',
        text2: 'Choose size, color, or other options',
      });
      return;
    }

    const success = addItem(product, 1, selectedVariation?.id, selectedAttributes, isStitched);
    if (success) {
       navigation.navigate('Checkout');
    }
  };

  const handleProductPress = useCallback((productId: number) => {
    setAllProducts([]);
    setCurrentPage(1);
    setHasMore(true);
    setCurrentImageIndex(0);
    loadingRef.current = false;
    
    navigation.push('ProductDetail', { productId });
  }, [navigation]);

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  };

  const renderCarouselDots = () => {
    if (!currentImages || currentImages.length <= 1) return null;

    return (
      <View style={styles.dotsContainer}>
        {currentImages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentImageIndex === index && styles.dotActive,
            ]}
          />
        ))}
      </View>
    );
  };

  const renderRatingStars = () => {
    return (
      <View style={styles.ratingSelector}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setReviewForm({ ...reviewForm, rating: star })}
          >
            <Text style={styles.ratingStar}>
              {star <= reviewForm.rating ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderReviewsSection = () => {
    if (!product) return null;

    return (
      <View style={styles.section}>
        <View style={styles.reviewsHeader}>
          <Text style={styles.sectionTitle}>Customer Reviews</Text>
          <TouchableOpacity
            style={styles.writeReviewBtn}
            onPress={() => setShowReviewForm(!showReviewForm)}
          >
            <Text style={styles.writeReviewText}>
              {showReviewForm ? 'Cancel' : 'Write Review'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Rating Overview */}
        {product.ratingCount > 0 && (
          <View style={styles.ratingOverview}>
            <View style={styles.ratingLeft}>
              <Text style={styles.ratingNumber}>{product.averageRating}</Text>
              <Text style={styles.ratingStars}>
                {'⭐'.repeat(Math.round(parseFloat(product.averageRating || '0')))}
              </Text>
              <Text style={styles.ratingCount}>{product.ratingCount} reviews</Text>
            </View>
          </View>
        )}

        {/* Review Form */}
        {showReviewForm && (
          <View style={styles.reviewForm}>
            <Text style={styles.formLabel}>Your Rating</Text>
            {renderRatingStars()}

            <Text style={styles.formLabel}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              value={reviewForm.reviewer}
              onChangeText={(text) => setReviewForm({ ...reviewForm, reviewer: text })}
            />

            <Text style={styles.formLabel}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              keyboardType="email-address"
              value={reviewForm.reviewer_email}
              onChangeText={(text) => setReviewForm({ ...reviewForm, reviewer_email: text })}
            />

            <Text style={styles.formLabel}>Review *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Share your experience..."
              multiline
              numberOfLines={4}
              value={reviewForm.review}
              onChangeText={(text) => setReviewForm({ ...reviewForm, review: text })}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={submitReview}
              disabled={submittingReview}
            >
              {submittingReview ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Reviews List */}
        {loadingReviews ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))
        ) : (
          <Text style={styles.noReviews}>No reviews yet. Be the first!</Text>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    if (allProducts.length >= MAX_PRODUCTS) {
      return (
        <View style={styles.shopLinkContainer}>
          <Text style={styles.shopLinkText}>Want to see more?</Text>
          <TouchableOpacity
            style={styles.shopLink}
            onPress={() => navigation.navigate('MainTabs', { screen: 'CategoriesTab' } as any)}
          >
            <Text style={styles.shopLinkButtonText}>Browse All Products →</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingMoreText}>Loading more...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (allProducts.length > 0) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No similar products found</Text>
      </View>
    );
  };

  const keyExtractor = useCallback((item: Product) => item.id.toString(), []);

  const getItemLayout = useCallback(
    (data: any, index: number) => ({
      length: PRODUCT_ITEM_HEIGHT,
      offset: PRODUCT_ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentPrice = selectedVariation?.price || product.price || '0';
  const currentRegularPrice = selectedVariation?.regular_price || product.regularPrice || '0';
  const isOnSale = selectedVariation?.on_sale || product.onSale || false;
  const isInStock = selectedVariation?.in_stock ?? product.inStock ?? false;
  const stockQuantity = selectedVariation?.stock_quantity ?? product.stockQuantity ?? null;

  const currentMaxQuantity = selectedVariation?.maxQuantity ?? product.maxQuantity ?? 99;
  const cartQuantity = getItemQuantity(product.id, selectedVariation?.id);
  const hasReachedLimit = cartQuantity >= currentMaxQuantity;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 50 : 40 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeftIcon color={COLORS.primary} size={24} />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
            <SearchIcon size={18} color={COLORS.text.muted} />
            <TextInput 
                placeholder="Search products..." 
                placeholderTextColor={COLORS.text.muted}
                style={styles.searchInput}
                returnKeyType="search"
                onSubmitEditing={(e) => navigation.push('ProductList', { search: e.nativeEvent.text })}
            />
        </View>

        <TouchableOpacity onPress={() => toggleWishlist(product)} style={styles.headerIconBtn}>
            <HeartIcon 
                size={24} 
                color={COLORS.primary} 
                filled={product && isInWishlist(product.id)} 
            />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'CartTab' } as any)} style={styles.cartBtn}>
            <CartIcon size={24} color={COLORS.primary} />
            {itemCount > 0 && (
                <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{itemCount}</Text>
                </View>
            )}
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={allProducts}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => (
          <View style={{ width: (width - 30) / 2, marginBottom: 10 }}>
            <ProductCard 
              item={item} 
              onPress={handleProductPress}
              isWishlisted={isInWishlist(item.id)}
              onWishlistPress={() => toggleWishlist(item)}
            /> 
          </View>
        )}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMoreProducts}
        onEndReachedThreshold={0.1}
        maxToRenderPerBatch={10}
        windowSize={10}
        // removeClippedSubviews={true}
        initialNumToRender={10}
        getItemLayout={getItemLayout}
        ListHeaderComponent={
          <>
            <View style={[styles.carouselContainer, { height: imageHeight }]}>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
              >
                {currentImages.map((image, index) => (
                  <Image
                    key={`carousel-${image.id}-${index}`}
                    source={{ uri: image.src }}
                    style={[styles.carouselImage, { height: imageHeight }]}
                    resizeMode="contain"
                  />
                ))}
              </ScrollView>
              {renderCarouselDots()}
              
              {isOnSale && (
                <View style={styles.saleBadge}>
                  <Text style={styles.saleBadgeText}>SALE</Text>
                </View>
              )}

              {!isInStock && (
                <View style={styles.stockBadge}>
                  <Text style={styles.stockBadgeText}>Out of Stock</Text>
                </View>
              )}
            </View>

            <View style={styles.contentContainer}>
              <View style={styles.headerSection}>
                <Text style={styles.productName}>{product.name}</Text>
                
                <View style={styles.priceRow}>
                  {isOnSale && (
                    <>
                      <View style={styles.priceWithIcon}>
                        <IndianRupeeIcon size={14} color="#999" />
                        <Text style={styles.regularPrice}>{Math.round(parseFloat(currentRegularPrice))}</Text>
                      </View>
                      <Text style={styles.discount}>
                        {Math.round(((parseFloat(currentRegularPrice) - parseFloat(currentPrice)) / parseFloat(currentRegularPrice)) * 100)}% OFF
                      </Text>
                    </>
                  )}
                </View>
                <View style={styles.priceWithIcon}>
                  <IndianRupeeIcon size={22} color={COLORS.primary} />
                  <Text style={styles.salePrice}>{Math.round(parseFloat(currentPrice))}</Text>
                </View>

                {product.averageRating && parseFloat(product.averageRating) > 0 && (
                  <View style={styles.ratingRow}>
                    <Text style={styles.stars}>
                      {'⭐'.repeat(Math.round(parseFloat(product.averageRating)))}
                    </Text>
                    <Text style={styles.ratingText}>
                      {product.averageRating} ({product.ratingCount} reviews)
                    </Text>
                  </View>
                )}

                <View style={styles.stockRow}>
                  <View style={[styles.stockDot, !isInStock && styles.stockDotOut]} />
                  <Text style={[styles.stockText, !isInStock && styles.stockTextOut]}>
                    {!isInStock ? 'Out of Stock' : 'In Stock'}
                  </Text>
                  {isInStock && product.manageStock && stockQuantity !== null && stockQuantity > 0 && (
                    <Text style={styles.stockQuantity}>
                      ({stockQuantity > 10 ? 'Available' : `Only a few left`})
                    </Text>
                  )}
                </View>
              </View>

              {product.categories && product.categories.length > 0 && (
                <View style={styles.categoriesSection}>
                  <Text style={styles.sectionLabel}>Categories:</Text>
                  <View style={styles.categoryTags}>
                    {product.categories.map((cat) => (
                      <View key={cat.id} style={styles.categoryTag}>
                        <Text style={styles.categoryTagText}>{cat.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {product.type === 'variable' && product.attributes && product.attributes.length > 0 && (
                <View style={styles.section}>
                  <VariationSelector
                    attributes={product.attributes}
                    variations={variations}
                    selectedAttributes={selectedAttributes}
                    onAttributeSelect={handleAttributeSelect}
                  />
                </View>
              )}

              {/* Stitching Options - Only for Unstitched Category (ID: 289) */}
              {product.categories?.some(c => c.id === 289) && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Stitching Options:</Text>
                <View style={styles.stitchingContainer}>
                  <TouchableOpacity 
                    style={[styles.stitchingOption, !isStitched && styles.stitchingOptionSelected]}
                    onPress={() => setIsStitched(false)}
                  >
                    <Text style={[styles.stitchingText, !isStitched && styles.stitchingTextSelected]}>Unstitched</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.stitchingOption, isStitched && styles.stitchingOptionSelected]}
                    onPress={() => setIsStitched(true)}
                  >
                    <Text style={[styles.stitchingText, isStitched && styles.stitchingTextSelected]}>Stitched</Text>
                    <View style={styles.stitchingPrice}>
                       <IndianRupeeIcon size={10} color={isStitched ? COLORS.white : COLORS.primary} />
                       <Text style={[styles.stitchingPriceText, isStitched && styles.stitchingPriceTextSelected]}>+{STITCHING_COST}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
              )}

              {product.shortDescription && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.description}>
                    {stripHtml(product.shortDescription)}
                  </Text>
                </View>
              )}

              {product.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Product Details</Text>
                  <Text style={styles.description}>
                    {stripHtml(product.description)}
                  </Text>
                </View>
              )}

              {renderReviewsSection()}

              <Text style={styles.sectionTitle}>Similar Products</Text>
            </View>
          </>
        }
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.flatListContent}
      />

      <View style={styles.bottomBar}>
        <View style={styles.bottomLeft}>
          <View style={styles.priceWithIcon}>
            <IndianRupeeIcon size={18} color={COLORS.primary} />
            <Text style={styles.bottomPrice}>
               {Math.round(parseFloat(currentPrice) + (isStitched ? STITCHING_COST : 0))}
            </Text>
          </View>
          {isOnSale && (
            <View style={styles.priceWithIcon}>
              <IndianRupeeIcon size={12} color="#999" />
              <Text style={styles.bottomOriginalPrice}>{Math.round(parseFloat(currentRegularPrice))}</Text>
              <Text style={styles.bottomDiscountText}>
                {Math.round(((parseFloat(currentRegularPrice) - parseFloat(currentPrice)) / parseFloat(currentRegularPrice)) * 100)}% OFF
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.buyNowBtn,
              (!isInStock || hasReachedLimit) && styles.disabledActionBtn,
            ]}
            onPress={handleBuyNow}
            disabled={!isInStock || hasReachedLimit}
          >
            <Text style={[styles.buyNowText, (!isInStock || hasReachedLimit) && styles.disabledText]}>Buy Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.addToCartBtn,
              (!isInStock) && styles.disabledActionBtn,
            ]}
            onPress={() => {
                if (cartQuantity > 0) {
                    navigation.navigate('MainTabs', { screen: 'CartTab' });
                } else {
                    handleAddToCart();
                }
            }}
            disabled={!isInStock}
          >
            <Text style={[styles.addToCartText, (!isInStock) && styles.disabledText]}>
              {!isInStock ? 'Out of Stock' : cartQuantity > 0 ? 'Go to Cart' : '🛒 Add'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white, // Changed from cream to white for cleaner look
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    zIndex: 100,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    display: 'none',
  },
  headerTitle: {
    display: 'none',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSubtle,
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 44,
    marginHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text.main,
    padding: 0,
    fontFamily: FONTS.display.medium,
  },
  cartBtn: {
    position: 'relative',
    padding: 5,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: COLORS.white,
    zIndex: 10,
  },
  cartBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontFamily: FONTS.display.bold,
  },
  headerIconBtn: {
      padding: 5,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.primary,
    fontFamily: FONTS.display.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
  },
  backButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  flatListContent: {
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    gap: 10, // Explicit gap
  },
  card: {
    // Moved inline to renderItem for sizing, but styles here just in case
  },
  imageContainer: {
    // ...
  },
  cardImage: {
    // ...
  },
  carouselContainer: {
    backgroundColor: COLORS.white,
    position: 'relative',
  },
  carouselImage: {
    width: CAROUSEL_WIDTH,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Darker dots for white bg
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  saleBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: COLORS.accent, // Gold/Premium look
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20, // Rounded pill
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saleBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: FONTS.display.bold,
    letterSpacing: 0.5,
  },
  stockBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backdropFilter: 'blur(10px)',
  },
  stockBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: FONTS.display.bold,
  },
  contentContainer: {
    padding: 20,
  },
  headerSection: {
    marginBottom: 20,
  },
  productName: {
    fontSize: 24,
    fontFamily: FONTS.serif.bold,
    color: COLORS.text.main,
    marginBottom: 8,
    lineHeight: 32,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  regularPrice: {
    fontSize: 16,
    color: COLORS.text.muted,
    textDecorationLine: 'line-through',
    marginRight: 8,
    fontFamily: FONTS.display.regular,
  },
  discount: {
    fontSize: 14,
    color: COLORS.error, // Red for discount is standard/good
    fontFamily: FONTS.display.bold,
  },
  salePrice: {
    fontSize: 28,
    fontFamily: FONTS.display.bold,
    color: COLORS.primary,
    marginBottom: 0,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  stars: {
    fontSize: 16,
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: FONTS.display.medium,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  stockDotOut: {
    backgroundColor: '#FF4444',
  },
  stockText: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: FONTS.display.medium,
  },
  stockTextOut: {
    color: '#FF4444',
  },
  stockQuantity: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 4,
    fontFamily: FONTS.display.regular,
  },
  categoriesSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 8,
    fontFamily: FONTS.display.medium,
  },
  categoryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)', // Subtle Gold
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  categoryTagText: {
    fontSize: 12,
    color: COLORS.primary, // Darker text for readability
    fontFamily: FONTS.display.medium,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.serif.semiBold,
    color: COLORS.text.main,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: COLORS.text.secondary,
    lineHeight: 24,
    fontFamily: FONTS.display.regular,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  writeReviewBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  writeReviewText: {
    color: COLORS.primary,
    fontFamily: FONTS.display.medium,
    fontSize: 14,
  },
  ratingOverview: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  ratingLeft: {
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 48,
    fontFamily: FONTS.display.bold,
    color: COLORS.primary,
  },
  ratingStars: {
    fontSize: 20,
    marginVertical: 8,
  },
  ratingCount: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: FONTS.display.regular,
  },
  reviewForm: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: FONTS.display.medium,
    color: COLORS.text.main,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontFamily: FONTS.display.regular,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  ratingSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  ratingStar: {
    fontSize: 32,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: FONTS.display.bold,
  },
  reviewItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAuthor: {
    fontSize: 15,
    fontFamily: FONTS.display.medium,
    color: COLORS.text.main,
  },
  reviewStars: {
    fontSize: 14,
  },
  reviewText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 22,
    marginBottom: 8,
    fontFamily: FONTS.display.regular,
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.text.muted,
  },
  verifiedBadge: {
    marginTop: 8,
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontFamily: FONTS.display.medium,
  },
  noReviews: {
    textAlign: 'center',
    color: COLORS.text.muted,
    fontSize: 14,
    paddingVertical: 20,
    fontFamily: FONTS.display.regular,
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingMoreText: {
    fontSize: 14,
    color: COLORS.primary,
    fontFamily: FONTS.display.medium,
  },
  shopLinkContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  shopLinkText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 16,
    fontFamily: FONTS.display.regular,
  },
  shopLink: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  shopLinkButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontFamily: FONTS.display.bold,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text.muted,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.95)', // Slightly translucent
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 25 : 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  bottomLeft: {
    flex: 1,
  },
  bottomPrice: {
    fontSize: 22,
    fontFamily: FONTS.display.bold,
    color: COLORS.primary,
  },
  bottomOriginalPrice: {
    fontSize: 14,
    color: COLORS.text.muted,
    textDecorationLine: 'line-through',
    fontFamily: FONTS.display.regular,
  },
  bottomDiscountText: {
    fontSize: 12,
    color: COLORS.error,
    fontFamily: FONTS.display.bold,
    marginLeft: 6,
  },
  priceWithIcon:{
    flexDirection: 'row',
    alignItems: 'center',
  },
  stitchingContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  stitchingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: COLORS.white,
  },
  stitchingOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  stitchingText: {
    fontSize: 14,
    color: COLORS.text.main,
    fontFamily: FONTS.display.medium,
  },
  stitchingTextSelected: {
    color: COLORS.white,
    fontFamily: FONTS.display.bold,
  },
  stitchingPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stitchingPriceText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 2,
    fontFamily: FONTS.display.bold,
  },
  stitchingPriceTextSelected: {
    color: COLORS.white,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    flex: 2, 
    justifyContent: 'flex-end',
  },
  buyNowBtn: {
    backgroundColor: COLORS.black, // Modern Black
    borderWidth: 0,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12, // More rounded
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buyNowText: {
    color: COLORS.white,
    fontFamily: FONTS.display.bold,
    fontSize: 14,
  },
  addToCartBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addToCartText: {
    color: COLORS.white,
    fontFamily: FONTS.display.bold,
    fontSize: 14,
  },
  disabledActionBtn: {
    backgroundColor: '#F5F5F5',
    borderColor: '#F5F5F5',
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledText: {
    color: '#999',
  },
});