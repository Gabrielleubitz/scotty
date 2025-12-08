import { collection, addDoc, getDocs, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { FirestoreRetryUtil } from './firestore-utils';

export interface ProductDeployment {
  id: string;
  teamId: string;
  productId: string;
  domain?: string;
  widgetType: 'full' | 'notification' | 'gtm';
  createdAt: Date;
  updatedAt: Date;
}

class ProductDeploymentService {
  /**
   * Save a product deployment when embed code is generated
   */
  async saveDeployment(
    teamId: string,
    productId: string,
    widgetType: 'full' | 'notification' | 'gtm',
    domain?: string
  ): Promise<void> {
    try {
      // Check if deployment already exists for this team/productId combination
      const existingQuery = query(
        collection(db, 'product_deployments'),
        where('teamId', '==', teamId),
        where('productId', '==', productId)
      );
      const existingDocs = await getDocs(existingQuery);

      if (!existingDocs.empty) {
        // Update existing deployment
        const existingDoc = existingDocs.docs[0];
        await FirestoreRetryUtil.withRetry(async () => {
          const { updateDoc, doc } = await import('firebase/firestore');
          await updateDoc(doc(db, 'product_deployments', existingDoc.id), {
            widgetType,
            domain: domain || existingDoc.data().domain || null,
            updatedAt: Timestamp.fromDate(new Date()),
          });
        });
      } else {
        // Create new deployment
        await FirestoreRetryUtil.withRetry(async () => {
          await addDoc(collection(db, 'product_deployments'), {
            teamId,
            productId,
            widgetType,
            domain: domain || null,
            createdAt: Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date()),
          });
        });
      }
    } catch (error) {
      console.error('Failed to save product deployment:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Get all deployments for a team
   */
  async getTeamDeployments(teamId: string): Promise<ProductDeployment[]> {
    try {
      const q = query(
        collection(db, 'product_deployments'),
        where('teamId', '==', teamId),
        orderBy('updatedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          teamId: data.teamId,
          productId: data.productId,
          domain: data.domain || undefined,
          widgetType: data.widgetType || 'full',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as ProductDeployment;
      });
    } catch (error) {
      console.error('Failed to get team deployments:', error);
      return [];
    }
  }

  /**
   * Get deployments by product ID
   */
  async getDeploymentsByProductId(teamId: string, productId: string): Promise<ProductDeployment[]> {
    try {
      const q = query(
        collection(db, 'product_deployments'),
        where('teamId', '==', teamId),
        where('productId', '==', productId)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          teamId: data.teamId,
          productId: data.productId,
          domain: data.domain || undefined,
          widgetType: data.widgetType || 'full',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as ProductDeployment;
      });
    } catch (error) {
      console.error('Failed to get deployments by product ID:', error);
      return [];
    }
  }
}

export const productDeploymentService = new ProductDeploymentService();

