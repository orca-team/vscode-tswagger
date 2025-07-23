import React from 'react';
import { Skeleton, Card } from 'antd';
import styles from './SkeletonLoader.less';

export interface SkeletonLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  loading?: boolean;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ loading = true, children, ...otherProps }) => {
  if (!loading) {
    return <>{children}</>;
  }

  return (
    <div className={styles.skeletonContainer} {...otherProps}>
      {/* Swagger Info Skeleton */}
      <Card className={styles.skeletonCard}>
        <Skeleton.Input active size="large" style={{ width: 300 }} />
      </Card>

      {/* API Groups Skeleton */}
      <div className={styles.skeletonContent}>
        {[1, 2, 3, 4, 5].map((index) => (
          <Card key={index} size="small" className={styles.skeletonCard}>
            <Skeleton.Input active size="default" style={{ width: 600 }} />
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SkeletonLoader;
