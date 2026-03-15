import { IDocument } from './document'

export interface IUser extends IDocument {
	name: string
	email: string
	photo_url: string | null
}
