import { ProductModuleScreen } from '../../components/ProductModuleScreen';
import { MOBILE_PRODUCT_MODULES } from '../../lib/product-modules';

export default function VerificationScreen() {
  return <ProductModuleScreen module={MOBILE_PRODUCT_MODULES.verification} />;
}
