export interface UserData {
  uid: string;
  email: string;
  createdAt: Date;
  provider: 'password' | 'google';
  displayName?: string;
  password: string;
  trustedContacts?: string[];
  token?: string; 
  phoneNumber:string;
}