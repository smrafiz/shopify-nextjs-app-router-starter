export type AnnouncementType = "INFO" | "WARNING" | "PROMO" | "URGENT";

export interface Announcement {
  id: string;
  shopId: string;
  title: string;
  message: string;
  type: AnnouncementType;
  isActive: boolean;
  bgColor: string;
  textColor: string;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateAnnouncementInput = {
  title: string;
  message: string;
  type: AnnouncementType;
  bgColor: string;
  textColor: string;
  startsAt?: Date | null;
  endsAt?: Date | null;
};

export type UpdateAnnouncementInput = Partial<CreateAnnouncementInput> & {
  isActive?: boolean;
};
