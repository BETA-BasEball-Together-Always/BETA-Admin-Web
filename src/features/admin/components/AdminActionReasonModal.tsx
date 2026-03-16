import { useState } from 'react'

type AdminActionReasonModalProps = {
  open: boolean
  title: string
  targetLabel: string
  confirmLabel: string
  loading?: boolean
  errorMessage?: string | null
  onClose: () => void
  onConfirm: (reason: string) => void
}

export function AdminActionReasonModal({
  open,
  title,
  targetLabel,
  confirmLabel,
  loading = false,
  errorMessage = null,
  onClose,
  onConfirm,
}: AdminActionReasonModalProps) {
  const [reason, setReason] = useState('')

  if (!open) {
    return null
  }

  const trimmedReason = reason.trim()

  const handleConfirm = () => {
    if (!trimmedReason || loading) {
      return
    }

    onConfirm(trimmedReason)
  }

  return (
    <div className="admin-action-modal-overlay" onClick={onClose} role="presentation">
      <div
        aria-modal="true"
        className="surface admin-action-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="admin-action-modal-header">
          <div className="admin-action-modal-header-content">
            <h2 className="admin-action-modal-title">{title}</h2>
            <p className="admin-action-modal-target">
              <span className="admin-action-modal-target-chip">{targetLabel}</span>
            </p>
          </div>
        </div>

        <div className="admin-action-modal-body">
          <label className="admin-action-modal-field">
            <span className="form-label admin-action-modal-label">변경 사유</span>
            <textarea
              className="input-base admin-action-modal-textarea"
              onChange={(event) => setReason(event.target.value)}
              placeholder="변경 사유를 입력해주세요."
              rows={5}
              value={reason}
            />
          </label>

          {errorMessage ? (
            <p className="admin-action-modal-error">{errorMessage}</p>
          ) : null}
        </div>

        <div className="admin-action-modal-footer">
          <button
            className="btn-base btn-primary"
            disabled={!trimmedReason || loading}
            onClick={handleConfirm}
            type="button"
          >
            {loading ? '처리 중...' : confirmLabel}
          </button>
          <button className="btn-base btn-neutral" onClick={onClose} type="button">
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
