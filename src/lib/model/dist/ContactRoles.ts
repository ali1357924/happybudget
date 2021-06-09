/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */
export enum ContactRoleNames {
  PRODUCER = "Producer",
  EXECUTIVE_PRODUCER = "Executive Producer",
  PRODUCTION_MANAGER = "Production Manager",
  PRODUCTION_DESIGNER = "Production Designer",
  ACTOR = "Actor",
  DIRECTOR = "Director",
  MEDIC = "Medic",
  WARDROBE = "Wardrobe",
  WRITER = "Writer",
  CLIENT = "Client",
  OTHER = "Other"
}

export const ContactRoleModels: { [key: string]: Model.ContactRole } = {
  PRODUCER: { id: 0, name: ContactRoleNames.PRODUCER },
  EXECUTIVE_PRODUCER: { id: 1, name: ContactRoleNames.EXECUTIVE_PRODUCER },
  PRODUCTION_MANAGER: { id: 2, name: ContactRoleNames.PRODUCTION_MANAGER },
  PRODUCTION_DESIGNER: { id: 3, name: ContactRoleNames.PRODUCTION_DESIGNER },
  ACTOR: { id: 4, name: ContactRoleNames.ACTOR },
  DIRECTOR: { id: 5, name: ContactRoleNames.DIRECTOR },
  MEDIC: { id: 6, name: ContactRoleNames.MEDIC },
  WARDROBE: { id: 7, name: ContactRoleNames.WARDROBE },
  WRITER: { id: 8, name: ContactRoleNames.WRITER },
  CLIENT: { id: 9, name: ContactRoleNames.CLIENT },
  OTHER: { id: 10, name: ContactRoleNames.OTHER }
};

const ContactRoles = Object.values(ContactRoleModels);
export default ContactRoles;
