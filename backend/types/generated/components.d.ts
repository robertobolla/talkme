import type { Schema, Struct } from '@strapi/strapi';

export interface ContactEmergencyContact extends Struct.ComponentSchema {
  collectionName: 'components_contact_emergency_contacts';
  info: {
    description: 'Informaci\u00F3n de contacto de emergencia';
    displayName: 'Emergency Contact';
  };
  attributes: {
    address: Schema.Attribute.Text;
    email: Schema.Attribute.Email;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
    phone: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 20;
      }>;
    relationship: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'contact.emergency-contact': ContactEmergencyContact;
    }
  }
}
