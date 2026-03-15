import type { LucideIcon } from 'lucide-react'
import {
	Binary,
	Braces,
	Calendar,
	ChevronsLeftRightEllipsisIcon,
	Clock,
	DollarSign,
	FileText,
	Globe,
	Hash,
	Layers,
	List,
	MapPin,
	Network,
	Search,
	Text,
	ToggleLeft,
	Type,
} from 'lucide-react'

// Định nghĩa Category để truy xuất nhanh O(1) thay vì dùng Array.includes
export type TypeCategory =
	| 'string'
	| 'number'
	| 'boolean'
	| 'datetime'
	| 'binary'
	| 'json'
	| 'special'
	| 'unknown'

export interface TypeMapping {
	icon: LucideIcon
	label: string
	color: string // Tailwind text color class
	description: string
	category: TypeCategory
}

// Bảng tra cứu (Lookup Table) - Khai báo một lần, chạy cực nhanh
const typeMap: Record<string, TypeMapping> = {
	// ==========================================
	// 1. STRING TYPES (MySQL + Postgres)
	// ==========================================
	varchar: {
		icon: Type,
		label: 'VARCHAR',
		color: 'text-blue-500',
		description: 'Variable-length string',
		category: 'string',
	},
	character: {
		icon: Type,
		label: 'CHARACTER',
		color: 'text-blue-500',
		description: 'Variable-length string',
		category: 'string',
	},
	'character varying': {
		icon: Type,
		label: 'VARCHAR',
		color: 'text-blue-500',
		description: 'Variable-length string (PG)',
		category: 'string',
	},
	text: {
		icon: Text,
		label: 'TEXT',
		color: 'text-blue-600',
		description: 'Long text content',
		category: 'string',
	},
	longtext: {
		icon: FileText,
		label: 'LONGTEXT',
		color: 'text-blue-700',
		description: 'Very long text (MySQL)',
		category: 'string',
	},
	mediumtext: {
		icon: FileText,
		label: 'MEDIUMTEXT',
		color: 'text-blue-600',
		description: 'Medium text (MySQL)',
		category: 'string',
	},
	tinytext: {
		icon: Text,
		label: 'TINYTEXT',
		color: 'text-blue-400',
		description: 'Short text (MySQL)',
		category: 'string',
	},
	char: {
		icon: Type,
		label: 'CHAR',
		color: 'text-blue-500',
		description: 'Fixed-length string',
		category: 'string',
	},
	bpchar: {
		icon: Type,
		label: 'CHAR',
		color: 'text-blue-500',
		description: 'Blank-padded char (PG)',
		category: 'string',
	},
	name: {
		icon: Type,
		label: 'NAME',
		color: 'text-blue-400',
		description: 'Internal type for object names (PG)',
		category: 'string',
	},

	// ==========================================
	// 2. NUMERIC TYPES (MySQL + Postgres)
	// ==========================================
	integer: {
		icon: Hash,
		label: 'INTEGER',
		color: 'text-green-500',
		description: 'Whole number (4 bytes)',
		category: 'number',
	},
	int: {
		icon: Hash,
		label: 'INT',
		color: 'text-green-500',
		description: 'Whole number (4 bytes)',
		category: 'number',
	},
	int4: {
		icon: Hash,
		label: 'INT4',
		color: 'text-green-500',
		description: 'Whole number (PG)',
		category: 'number',
	},
	bigint: {
		icon: Hash,
		label: 'BIGINT',
		color: 'text-green-600',
		description: 'Large whole number (8 bytes)',
		category: 'number',
	},
	int8: {
		icon: Hash,
		label: 'INT8',
		color: 'text-green-600',
		description: 'Large whole number (PG)',
		category: 'number',
	},
	smallint: {
		icon: Hash,
		label: 'SMALLINT',
		color: 'text-green-400',
		description: 'Small whole number (2 bytes)',
		category: 'number',
	},
	int2: {
		icon: Hash,
		label: 'INT2',
		color: 'text-green-400',
		description: 'Small whole number (PG)',
		category: 'number',
	},
	tinyint: {
		icon: Hash,
		label: 'TINYINT',
		color: 'text-green-400',
		description: 'Tiny number (1 byte)',
		category: 'number',
	},
	decimal: {
		icon: DollarSign,
		label: 'DECIMAL',
		color: 'text-emerald-500',
		description: 'Exact decimal number',
		category: 'number',
	},
	numeric: {
		icon: DollarSign,
		label: 'NUMERIC',
		color: 'text-emerald-500',
		description: 'Exact decimal number',
		category: 'number',
	},
	float: {
		icon: Hash,
		label: 'FLOAT',
		color: 'text-green-500',
		description: 'Floating-point number',
		category: 'number',
	},
	float4: {
		icon: Hash,
		label: 'FLOAT4',
		color: 'text-green-500',
		description: 'Single-precision float (PG)',
		category: 'number',
	},
	double: {
		icon: Hash,
		label: 'DOUBLE',
		color: 'text-green-600',
		description: 'Double-precision float',
		category: 'number',
	},
	'double precision': {
		icon: Hash,
		label: 'DOUBLE',
		color: 'text-green-600',
		description: 'Double-precision float',
		category: 'number',
	},
	float8: {
		icon: Hash,
		label: 'FLOAT8',
		color: 'text-green-600',
		description: 'Double-precision float (PG)',
		category: 'number',
	},
	real: {
		icon: Hash,
		label: 'REAL',
		color: 'text-green-500',
		description: 'Single-precision float',
		category: 'number',
	},
	money: {
		icon: DollarSign,
		label: 'MONEY',
		color: 'text-emerald-600',
		description: 'Currency amount (PG)',
		category: 'number',
	},
	serial: {
		icon: Hash,
		label: 'SERIAL',
		color: 'text-green-500',
		description: 'Auto-incrementing integer (PG)',
		category: 'number',
	},
	bigserial: {
		icon: Hash,
		label: 'BIGSERIAL',
		color: 'text-green-600',
		description: 'Auto-incrementing large int (PG)',
		category: 'number',
	},

	// ==========================================
	// 3. BOOLEAN TYPES (MySQL + Postgres)
	// ==========================================
	boolean: {
		icon: ToggleLeft,
		label: 'BOOLEAN',
		color: 'text-yellow-500',
		description: 'True/False value',
		category: 'boolean',
	},
	bool: {
		icon: ToggleLeft,
		label: 'BOOL',
		color: 'text-yellow-500',
		description: 'True/False value',
		category: 'boolean',
	},
	bit: {
		icon: ToggleLeft,
		label: 'BIT',
		color: 'text-yellow-600',
		description: 'Bit-field type',
		category: 'boolean',
	},

	// ==========================================
	// 4. DATE/TIME TYPES (MySQL + Postgres)
	// ==========================================
	date: {
		icon: Calendar,
		label: 'DATE',
		color: 'text-purple-500',
		description: 'Calendar date',
		category: 'datetime',
	},
	datetime: {
		icon: Clock,
		label: 'DATETIME',
		color: 'text-purple-600',
		description: 'Date and time',
		category: 'datetime',
	},
	timestamp: {
		icon: Clock,
		label: 'TIMESTAMP',
		color: 'text-purple-600',
		description: 'Date and time (timezone aware)',
		category: 'datetime',
	},
	timestamptz: {
		icon: Clock,
		label: 'TIMESTAMPTZ',
		color: 'text-purple-600',
		description: 'Timestamp with timezone (PG)',
		category: 'datetime',
	},
	time: {
		icon: Clock,
		label: 'TIME',
		color: 'text-purple-500',
		description: 'Time of day',
		category: 'datetime',
	},
	timetz: {
		icon: Clock,
		label: 'TIMETZ',
		color: 'text-purple-500',
		description: 'Time with timezone (PG)',
		category: 'datetime',
	},
	year: {
		icon: Calendar,
		label: 'YEAR',
		color: 'text-purple-400',
		description: 'Year value (MySQL)',
		category: 'datetime',
	},
	interval: {
		icon: Clock,
		label: 'INTERVAL',
		color: 'text-purple-400',
		description: 'Time span (PG)',
		category: 'datetime',
	},

	// ==========================================
	// 5. BINARY TYPES
	// ==========================================
	blob: {
		icon: Binary,
		label: 'BLOB',
		color: 'text-gray-500',
		description: 'Binary large object',
		category: 'binary',
	},
	longblob: {
		icon: Binary,
		label: 'LONGBLOB',
		color: 'text-gray-600',
		description: 'Large binary data',
		category: 'binary',
	},
	mediumblob: {
		icon: Binary,
		label: 'MEDIUMBLOB',
		color: 'text-gray-500',
		description: 'Medium binary data',
		category: 'binary',
	},
	tinyblob: {
		icon: Binary,
		label: 'TINYBLOB',
		color: 'text-gray-400',
		description: 'Small binary data',
		category: 'binary',
	},
	binary: {
		icon: Binary,
		label: 'BINARY',
		color: 'text-gray-500',
		description: 'Fixed-length binary',
		category: 'binary',
	},
	varbinary: {
		icon: Binary,
		label: 'VARBINARY',
		color: 'text-gray-500',
		description: 'Variable-length binary',
		category: 'binary',
	},
	bytea: {
		icon: Binary,
		label: 'BYTEA',
		color: 'text-gray-500',
		description: 'Binary data (PG)',
		category: 'binary',
	},

	// ==========================================
	// 6. JSON / XML
	// ==========================================
	json: {
		icon: Braces,
		label: 'JSON',
		color: 'text-orange-500',
		description: 'JSON data',
		category: 'json',
	},
	jsonb: {
		icon: Braces,
		label: 'JSONB',
		color: 'text-orange-600',
		description: 'Binary JSON (PG)',
		category: 'json',
	},
	xml: {
		icon: FileText,
		label: 'XML',
		color: 'text-orange-500',
		description: 'XML data',
		category: 'json',
	},

	// ==========================================
	// 7. SPECIAL TYPES (Postgres & MySQL specifics)
	// ==========================================
	uuid: {
		icon: Globe,
		label: 'UUID',
		color: 'text-cyan-500',
		description: 'Universally unique identifier',
		category: 'special',
	},
	enum: {
		icon: List,
		label: 'ENUM',
		color: 'text-indigo-500',
		description: 'Enumeration of values',
		category: 'special',
	},
	set: {
		icon: Layers,
		label: 'SET',
		color: 'text-indigo-500',
		description: 'Set of values (MySQL)',
		category: 'special',
	},

	// Postgres Specifics
	inet: {
		icon: Network,
		label: 'INET',
		color: 'text-cyan-600',
		description: 'IPv4/IPv6 address (PG)',
		category: 'special',
	},
	cidr: {
		icon: Network,
		label: 'CIDR',
		color: 'text-cyan-600',
		description: 'IPv4/IPv6 network (PG)',
		category: 'special',
	},
	macaddr: {
		icon: Network,
		label: 'MACADDR',
		color: 'text-cyan-600',
		description: 'MAC address (PG)',
		category: 'special',
	},
	geometry: {
		icon: MapPin,
		label: 'GEOMETRY',
		color: 'text-pink-500',
		description: 'Spatial geometry (PostGIS)',
		category: 'special',
	},
	geography: {
		icon: MapPin,
		label: 'GEOGRAPHY',
		color: 'text-pink-600',
		description: 'Spatial geography (PostGIS)',
		category: 'special',
	},
	tsvector: {
		icon: Search,
		label: 'TSVECTOR',
		color: 'text-teal-500',
		description: 'Text search document (PG)',
		category: 'special',
	},
	tsquery: {
		icon: Search,
		label: 'TSQUERY',
		color: 'text-teal-500',
		description: 'Text search query (PG)',
		category: 'special',
	},
	array: {
		icon: Layers,
		label: 'ARRAY',
		color: 'text-indigo-400',
		description: 'Array of elements (PG)',
		category: 'special',
	},

	// Fallback
	unknown: {
		icon: ChevronsLeftRightEllipsisIcon,
		label: 'UNKNOWN',
		color: 'text-gray-400',
		description: 'Unknown data type',
		category: 'unknown',
	},
}

/**
 * Tối ưu hóa hàm chuẩn hóa Data Type
 * - Cắt bỏ phần "unsigned" của MySQL (VD: "int unsigned" -> "int")
 * - Cắt bỏ phần ngoặc chứa độ dài (VD: "varchar(255)" -> "varchar", "enum('a','b')" -> "enum")
 * - Cắt bỏ ký hiệu mảng của Postgres (VD: "integer[]" -> "integer", nhưng label sẽ hiển thị là Array nếu cần)
 */
export function getTypeInfo(rawDataType: string): TypeMapping {
	if (!rawDataType) return typeMap['unknown']

	let normalized = rawDataType.toLowerCase().trim()

	// Nếu là mảng của Postgres (vd: varchar[] hoặc integer[]) -> Map về 'array'
	if (normalized.endsWith('[]') || normalized === 'array') {
		return typeMap['array']
	}

	// 1. Cắt bỏ các modifier như "unsigned", "zerofill" của MySQL
	normalized = normalized.replace(/\b(unsigned|zerofill)\b/g, '').trim()

	// 2. Cắt bỏ phần tham số trong ngoặc đơn.
	// Vd: varchar(255) -> varchar, decimal(10,2) -> decimal, enum('a','b') -> enum
	normalized = normalized.replace(/\([^)]*\)/g, '').trim()

	// 3. Nếu là kiểu có khoảng trắng ở giữa hợp lệ (như 'double precision', 'character varying')
	// thì giữ nguyên, nếu không thì lấy từ khóa đầu tiên (Vd: "timestamp without time zone" -> "timestamp")
	if (!typeMap[normalized]) {
		normalized = normalized.split(' ')[0]
	}

	return typeMap[normalized] || typeMap['unknown']
}
