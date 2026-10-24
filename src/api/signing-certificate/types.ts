export enum SigningCertificateStatus {
	Pending = "pending",
	Active = "active",
	Rejected = "rejected",
	Revoked = "revoked",
}

export interface SigningCertificate {
	id: string
	status: SigningCertificateStatus
	/** Đang dùng nhưng đã hết hạn: phải đăng ký lại */
	expired: boolean
	serialNumber: string | null
	notBefore: string | null
	notAfter: string | null
	reviewNote: string | null
	reviewedAt: string | null
	reviewedBy: { id: string, fullName: string, avatar?: string } | null
	revokedAt: string | null
	createdAt: string
	user: { id: string, fullName: string, loginName: string, avatar?: string, department: { id: string, name: string } | null }
}

/** Chứng thư của tôi: kèm ảnh chữ ký tay (data URL) */
export interface MySigningCertificate extends SigningCertificate {
	signatureImage: string | null
}

export interface SigningCertificateSearchParams {
	page?: number
	limit?: number
	status?: SigningCertificateStatus
	search?: string
}

/** Vị trí khung chữ ký theo điểm PDF (1/72 inch), gốc góc DƯỚI-TRÁI trang */
export interface SignaturePlacement {
	page: number
	x: number
	y: number
	width: number
	height: number
}

export interface SigningDocument {
	/** Id văn bản gốc — khóa của vị trí ký */
	id: string
	/** Bản PDF của vòng để xem / ký (văn bản Word đã chuyển sang PDF, hoặc bản đã ký mới nhất) */
	fileId?: string
	filename: string
	/** false: không ký được (ảnh, zip…) — giữ nguyên */
	signable: boolean
	size?: number
	/** Vị trí tự xếp (chân trang cuối, không đè chữ ký có sẵn) */
	auto?: SignaturePlacement
	/** Khung người trình đặt sẵn cho bước này (null = tự xếp); locked thì người duyệt không được dời */
	preset?: { placement: SignaturePlacement, locked: boolean } | null
	/** Kích thước từng trang + khung chữ ký đã có [llx, lly, urx, ury] */
	pages?: { page: number, width: number, height: number, signatures: number[][] }[]
}

export interface SigningPreparation {
	certificate: { id: string, notAfter: string | null, hasSignatureImage: boolean } | null
	/** Chữ trong khung chữ ký (đúng như bản ký; thời gian là lúc chuẩn bị, khi ký sẽ là thời điểm ký) */
	signatureLines: string[]
	documents: SigningDocument[]
}

/** Tình trạng một chữ ký: hợp lệ / chứng thư đã thu hồi (sau khi ký) / không do hệ thống cấp / văn bản đã bị sửa */
export type PdfSignatureStatus = "valid" | "revoked" | "untrusted" | "tampered";

/** Một chữ ký trên văn bản PDF (backend đã kiểm chữ ký thật trong tệp) */
export interface PdfSignatureInfo {
	id: string
	signerName: string | null
	/** Tên bước duyệt lúc ký */
	step: string | null
	signedAt: string | null
	status: PdfSignatureStatus
	revokedAt: string | null
	/** Lý do kiểm không đạt (chỉ khi untrusted / tampered) */
	error: string | null
}
