import React from 'react';
import { Skeleton, Card } from 'antd';
import styles from './SkeletonLoader.less';

export interface SkeletonLoaderProps {
  loading?: boolean;
  children?: React.ReactNode;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ loading = true, children }) => {
  if (!loading) {
    return <>{children}</>;
  }

  return (
    <div className={styles.skeletonContainer}>
      {/* Swagger Info Skeleton */}
      <Card className={styles.skeletonCard}>
        <Skeleton.Input active size="large" style={{ width: 200, marginBottom: 12 }} />
        <Skeleton.Input active size="small" style={{ width: 300, marginBottom: 8 }} />
        <Skeleton.Input active size="small" style={{ width: 150 }} />
      </Card>

      {/* API Groups Skeleton */}
      {[1, 2, 3].map((index) => (
        <Card key={index} className={styles.skeletonCard}>
          <div className={styles.skeletonHeader}>
            <Skeleton.Input active size="default" style={{ width: 120 }} />
            <Skeleton.Button active size="small" />
          </div>
          <div className={styles.skeletonContent}>
            {[1, 2, 3].map((apiIndex) => (
              <div key={apiIndex} className={styles.skeletonApiItem}>
                <Skeleton.Button active size="small" style={{ width: 60, marginRight: 12 }} />
                <Skeleton.Input active size="small" style={{ width: 200, marginRight: 12 }} />
                <Skeleton.Input active size="small" style={{ width: 100 }} />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default SkeletonLoader;