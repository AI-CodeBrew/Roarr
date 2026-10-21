"""
Image Comparison API for Emagen
Converted from FastAPI to Flask with storage integration
"""

import os
import base64
import io
from typing import Tuple, List, Dict, Any
from PIL import Image
import logging

# Optional imports for advanced image comparison
try:
    import numpy as np
    import cv2
    from skimage.metrics import structural_similarity as ssim
    import imagehash
    import insightface
    from numpy.linalg import norm
    ADVANCED_COMPARISON_AVAILABLE = True
except ImportError:
    ADVANCED_COMPARISON_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("Advanced image comparison dependencies not available. Using basic comparison only.")

logger = logging.getLogger(__name__)

# Configure CoreML for InsightFace on Apple Silicon (optional)
try:
    os.environ["ORT_COREML_ENABLE"] = "1"          # allow CoreML EP
    os.environ["ORT_COREML_FP16_ENABLE"] = "1"     # use FP16 on Apple Silicon when possible
except:
    pass  # onnxruntime not available, will use default providers

class ImageComparisonAPI:
    def __init__(self):
        self._arcface_app = None
    
    def get_arcface_app(self):
        """Get or initialize ArcFace application"""
        if not ADVANCED_COMPARISON_AVAILABLE:
            raise RuntimeError("Advanced image comparison not available - missing dependencies")
        
        if self._arcface_app is None:
            try:
                # Try with CoreML first, fallback to CPU if not available
                providers = ["CPUExecutionProvider"]
                try:
                    providers.insert(0, "CoreMLExecutionProvider")
                except:
                    pass  # CoreML not available, use CPU only
                
                self._arcface_app = insightface.app.FaceAnalysis(
                    name="buffalo_l",
                    providers=providers
                )
                self._arcface_app.prepare(ctx_id=-1, det_size=(640, 640))
            except Exception as e:
                raise RuntimeError(f"Failed to initialize InsightFace: {e}")
        return self._arcface_app
    
    def load_rgb(self, image_data: bytes, max_side: int = 1200) -> Image.Image:
        """Load and resize image from bytes"""
        img = Image.open(io.BytesIO(image_data)).convert("RGB")
        w, h = img.size
        sc = min(1.0, max_side / max(w, h))
        if sc < 1.0:
            img = img.resize((int(w*sc), int(h*sc)), Image.LANCZOS)
        return img
    
    def to_cv_gray(self, pil_img: Image.Image):
        """Convert PIL image to OpenCV grayscale"""
        if not ADVANCED_COMPARISON_AVAILABLE:
            return None
        arr = np.array(pil_img)[:, :, ::-1]
        return cv2.cvtColor(arr, cv2.COLOR_BGR2GRAY)
    
    def ssim_score(self, img1: Image.Image, img2: Image.Image) -> float:
        """Calculate SSIM score between two images"""
        if not ADVANCED_COMPARISON_AVAILABLE:
            return 0.5  # Default neutral score when advanced comparison not available
        w = min(img1.width, img2.width)
        h = min(img1.height, img2.height)
        g1 = self.to_cv_gray(img1.resize((w, h), Image.LANCZOS))
        g2 = self.to_cv_gray(img2.resize((w, h), Image.LANCZOS))
        score, _ = ssim(g1, g2, full=True)
        return float(score)
    
    def phash_min_dist(self, img1: Image.Image, img2: Image.Image) -> Tuple[int, Tuple[str, str]]:
        """Calculate minimum perceptual hash distance between images"""
        if not ADVANCED_COMPARISON_AVAILABLE:
            return (10, ("full", "full"))  # Default moderate distance when advanced comparison not available
        
        def crops(im: Image.Image):
            W, H = im.size; m = 0.05
            x1, y1 = int(W*m), int(H*m); x2, y2 = int(W*(1-m)), int(H*(1-m))
            return {
                "full": im,
                "center90": im.crop((x1, y1, x2, y2)),
                "tl90": im.crop((0, 0, x2, y2)),
                "tr90": im.crop((W - x2, 0, W, y2)),
                "bl90": im.crop((0, H - y2, x2, H)),
                "br90": im.crop((W - x2, H - y2, W, H)),
            }.items()
        
        best = (999, ("", ""))
        for n1, c1 in crops(img1):
            h1 = imagehash.phash(c1)
            for n2, c2 in crops(img2):
                h2 = imagehash.phash(c2)
                d = h1 - h2
                if d < best[0]:
                    best = (d, (n1, n2))
        return best
    
    def orb_match_stats(self, img1: Image.Image, img2: Image.Image) -> Tuple[int, float]:
        """Calculate ORB feature matching statistics"""
        if not ADVANCED_COMPARISON_AVAILABLE:
            return (20, 0.3)  # Default moderate values when advanced comparison not available
        
        g1 = self.to_cv_gray(img1)
        g2 = self.to_cv_gray(img2)
        orb = cv2.ORB_create(nfeatures=4000)
        k1, d1 = orb.detectAndCompute(g1, None)
        k2, d2 = orb.detectAndCompute(g2, None)
        
        if d1 is None or d2 is None or len(k1) < 8 or len(k2) < 8:
            return 0, 0.0
        
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
        matches = bf.knnMatch(d1, d2, k=2)
        good = [m for m, n in matches if m.distance < 0.75*n.distance]
        inlier_ratio = 0.0
        
        if len(good) >= 8:
            src = np.float32([k1[m.queryIdx].pt for m in good]).reshape(-1,1,2)
            dst = np.float32([k2[m.trainIdx].pt for m in good]).reshape(-1,1,2)
            _, mask = cv2.findHomography(src, dst, cv2.RANSAC, 5.0)
            if mask is not None:
                inlier_ratio = float(mask.sum()/max(1,len(good)))
        
        return len(good), inlier_ratio
    
    def decide_scene_same(self, ssim_val: float, phash_min: int, orb_good: int, orb_inlier: float,
                          ssim_thr=0.92, phash_thr=8, orb_good_thr=35, orb_inlier_thr=0.35) -> Tuple[bool, str]:
        """Decide if scenes are the same based on multiple criteria"""
        reasons = []
        if ssim_val >= ssim_thr: 
            reasons.append(f"SSIM {ssim_val:.3f}≥{ssim_thr}")
        if phash_min <= phash_thr: 
            reasons.append(f"pHash(min) {phash_min}≤{phash_thr}")
        if (orb_good >= orb_good_thr) or (orb_inlier >= orb_inlier_thr):
            reasons.append(f"ORB good={orb_good}≥{orb_good_thr} or inlier={orb_inlier:.2f}≥{orb_inlier_thr}")
        
        return (len(reasons) > 0, " | ".join(reasons) if reasons else "No scene criteria passed")
    
    def primary_face_embedding(self, img: Image.Image):
        """Return (embedding, bbox_area) for the largest detected face, or (None, 0)"""
        if not ADVANCED_COMPARISON_AVAILABLE:
            return None, 0  # No face detection when advanced comparison not available
        
        app = self.get_arcface_app()
        bgr = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        faces = app.get(bgr)
        
        if not faces:
            return None, 0
        
        largest = max(faces, key=lambda f: (f.bbox[2]-f.bbox[0])*(f.bbox[3]-f.bbox[1]))
        emb = largest.normed_embedding  # L2-normalized 512-d vector
        area = (largest.bbox[2]-largest.bbox[0])*(largest.bbox[3]-largest.bbox[1])
        return emb, area
    
    def face_similarity(self, emb1, emb2) -> float:
        """Calculate cosine similarity between face embeddings"""
        if not ADVANCED_COMPARISON_AVAILABLE:
            return 0.5  # Default neutral similarity when advanced comparison not available
        return float(np.dot(emb1, emb2) / (norm(emb1)*norm(emb2)))
    
    def compare_images(self, image1_data: bytes, image2_data: bytes, save_images: bool = False) -> Dict[str, Any]:
        """
        Compare two images and return detailed results
        
        Args:
            image1_data: First image as bytes
            image2_data: Second image as bytes
            save_images: Whether to save images to storage
            
        Returns:
            Dict with comparison results
        """
        try:
            logger.info("Starting image comparison")
            # Load images
            img1 = self.load_rgb(image1_data)
            img2 = self.load_rgb(image2_data)
            
            # Save images if requested
            saved_images = {}
            if save_images:
                from .storage_utils import storage_manager
                # Save first image
                save_result1 = storage_manager.save_uploaded_image(
                    f"data:image/jpeg;base64,{base64.b64encode(image1_data).decode()}"
                )
                if save_result1['success']:
                    saved_images['image1'] = save_result1
                
                # Save second image
                save_result2 = storage_manager.save_uploaded_image(
                    f"data:image/jpeg;base64,{base64.b64encode(image2_data).decode()}"
                )
                if save_result2['success']:
                    saved_images['image2'] = save_result2
            
            # Scene comparison
            ssim_val = self.ssim_score(img1, img2)
            ph_min, ph_crops = self.phash_min_dist(img1, img2)
            orb_good, orb_inlier = self.orb_match_stats(img1, img2)
            scene_same, scene_why = self.decide_scene_same(ssim_val, ph_min, orb_good, orb_inlier)
            
            # Face identity check
            face_note = "No face check"
            identity_same = True
            
            if scene_same:
                emb1, a1 = self.primary_face_embedding(img1)
                emb2, a2 = self.primary_face_embedding(img2)
                
                if emb1 is not None and emb2 is not None:
                    sim = self.face_similarity(emb1, emb2)
                    FACE_SIM_THR = 0.40
                    identity_same = sim >= FACE_SIM_THR
                    face_note = f"Face cosine similarity={sim:.3f} (thr={FACE_SIM_THR})"
                else:
                    face_note = "Face not found in one/both images; skipped identity check."
            
            final_same = scene_same and identity_same
            
            result_data = {
                'same': final_same,
                'scene_same': scene_same,
                'identity_same': identity_same,
                'ssim_score': ssim_val,
                'phash_min_distance': ph_min,
                'phash_crops': f"{ph_crops[0]} vs {ph_crops[1]}",
                'orb_good_matches': orb_good,
                'orb_inlier_ratio': orb_inlier,
                'face_similarity_score': sim if 'sim' in locals() else None,
                'face_note': face_note,
                'reason': scene_why,
                'saved_images': saved_images if saved_images else None
            }
            
            logger.info(f"Image comparison completed: {'SAME' if final_same else 'DIFFERENT'}")
            return {
                'success': True,
                'data': result_data,
                'message': 'Image comparison completed'
            }
            
        except Exception as e:
            logger.error(f"Image comparison failed: {str(e)}")
            return {
                'success': False,
                'error': f"Image comparison failed: {str(e)}"
            }

# Global instance
image_comparison_api = ImageComparisonAPI()
