import { memo } from 'react';
import type { Achievement } from '../../../types/api';
import './CelebrationModal.scss';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  newAchievements?: Achievement[];
}

/**
 * 计划完成庆祝弹框
 * 当所有任务完成时显示，可显示新解锁的成就
 */
export const CelebrationModal = memo(function CelebrationModal({
  isOpen,
  onClose,
  newAchievements = [],
}: CelebrationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="celebration-modal-overlay" onClick={onClose}>
      <div className="celebration-modal" onClick={(e) => e.stopPropagation()}>
        <button className="celebration-modal__close" onClick={onClose} type="button">
          <i className="fas fa-xmark"></i>
        </button>

        <div className="celebration-modal__icon">
          <span className="celebration-icon">🎉</span>
        </div>

        <h2 className="celebration-modal__title">恭喜！计划已全部完成</h2>

        <p className="celebration-modal__subtitle">
          你已完成所有学习任务，继续保持！
        </p>

        {newAchievements.length > 0 && (
          <div className="celebration-modal__achievements">
            <h3 className="achievements-title">新解锁成就</h3>
            <div className="achievements-list">
              {newAchievements.map((achievement) => (
                <div key={achievement.id} className="achievement-item">
                  <span className="achievement-icon">
                    <i className={`fas ${achievement.icon}`}></i>
                  </span>
                  <div className="achievement-info">
                    <span className="achievement-name">{achievement.name}</span>
                    {achievement.description && (
                      <span className="achievement-desc">{achievement.description}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button className="btn btn-primary celebration-modal__btn" onClick={onClose} type="button">
          太棒了！
        </button>
      </div>
    </div>
  );
});
