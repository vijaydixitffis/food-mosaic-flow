import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AddressForm } from './AddressForm';
import { Client, CreateClientDTO, UpdateClientDTO } from '@/types/client';
import React from 'react';

const clientSchema = z.object({
  client_code: z.string().min(2, 'Client code must be at least 2 characters'),
  name: z.string().min(2, 'Name is required'),
  gst_number: z.string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      'Invalid GST number format'
    )
    .optional()
    .or(z.literal('')),
  is_igst: z.boolean().default(false),
  company_registration_number: z.string().optional(),
  office_phone_number: z.string()
    .regex(/^[0-9]{10,15}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  contact_person1_name: z.string().optional(),
  contact_person1_phone: z.string()
    .regex(/^[0-9]{10,15}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  contact_person2_name: z.string().optional(),
  contact_person2_phone: z.string()
    .regex(/^[0-9]{10,15}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  registered_office_address: z.object({
    address_line1: z.string().min(1, 'Address line 1 is required'),
    address_line2: z.string().optional(),
    landmark: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid pincode'),
  }),
  bill_to_address: z.object({
    same_as_registered: z.boolean().default(true),
    address: z.object({
      address_line1: z.string().min(1, 'Address line 1 is required'),
      address_line2: z.string().optional(),
      landmark: z.string().optional(),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid pincode'),
    }).optional(),
  }),
  ship_to_address: z.object({
    same_as_billing: z.boolean().default(true),
    address: z.object({
      address_line1: z.string().min(1, 'Address line 1 is required'),
      address_line2: z.string().optional(),
      landmark: z.string().optional(),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid pincode'),
    }).optional(),
  }),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormProps {
  initialData?: Client | null;
  onSubmit: (data: CreateClientDTO | UpdateClientDTO) => void;
  isSubmitting: boolean;
}

export function ClientForm({ initialData, onSubmit, isSubmitting }: ClientFormProps) {
  const defaultValues = initialData ? {
    ...initialData,
    bill_to_address: {
      same_as_registered: !initialData.bill_to_address,
      address: initialData.bill_to_address || {
        address_line1: '',
        city: '',
        state: '',
        pincode: '',
      },
    },
    ship_to_address: {
      same_as_billing: !initialData.ship_to_address,
      address: initialData.ship_to_address || {
        address_line1: '',
        city: '',
        state: '',
        pincode: '',
      },
    },
  } : {
    client_code: '',
    name: '',
    gst_number: '',
    is_igst: false,
    company_registration_number: '',
    office_phone_number: '',
    contact_person1_name: '',
    contact_person1_phone: '',
    contact_person2_name: '',
    contact_person2_phone: '',
    registered_office_address: {
      address_line1: '',
      address_line2: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
    },
    bill_to_address: {
      same_as_registered: true,
      address: {
        address_line1: '',
        address_line2: '',
        landmark: '',
        city: '',
        state: '',
        pincode: '',
      },
    },
    ship_to_address: {
      same_as_billing: true,
      address: {
        address_line1: '',
        address_line2: '',
        landmark: '',
        city: '',
        state: '',
        pincode: '',
      },
    },
  };

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues,
  });

  const handleFormSubmit = (data: ClientFormValues) => {
    const formattedData = {
      ...data,
      bill_to_address: data.bill_to_address.same_as_registered 
        ? undefined 
        : data.bill_to_address.address,
      ship_to_address: data.ship_to_address.same_as_billing 
        ? undefined 
        : data.ship_to_address.address,
    };
    
    onSubmit(formattedData as CreateClientDTO | UpdateClientDTO);
  };

  const billSameAsRegistered = form.watch('bill_to_address.same_as_registered');
  const shipSameAsBilling = form.watch('ship_to_address.same_as_billing');
  const registeredOfficeAddress = form.watch('registered_office_address');
  const billToAddress = form.watch('bill_to_address.address');

  // Sync addresses when checkboxes are toggled
  React.useEffect(() => {
    if (billSameAsRegistered && registeredOfficeAddress) {
      form.setValue('bill_to_address.address', { ...registeredOfficeAddress });
    }
  }, [billSameAsRegistered, registeredOfficeAddress, form]);

  React.useEffect(() => {
    if (shipSameAsBilling && billToAddress) {
      form.setValue('ship_to_address.address', { ...billToAddress });
    }
  }, [shipSameAsBilling, billToAddress, form]);

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client_code">Client Code *</Label>
            <Input
              id="client_code"
              {...form.register('client_code')}
              disabled={!!initialData}
            />
            {form.formState.errors.client_code && (
              <p className="text-sm text-red-500">
                {form.formState.errors.client_code.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input id="name" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
            <Label htmlFor="gst_number">GST Number</Label>
            <Input
              id="gst_number"
              placeholder="22AAAAA0000A1Z5"
              {...form.register('gst_number')}
            />
            {form.formState.errors.gst_number && (
              <p className="text-sm text-red-500">
                {form.formState.errors.gst_number.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_registration_number">Company Reg. No.</Label>
            <Input
              id="company_registration_number"
              {...form.register('company_registration_number')}
            />
          </div>
          <div className="flex items-end space-x-2">
            <Controller
              name="is_igst"
              control={form.control}
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_igst"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label htmlFor="is_igst">IS IGST</Label>
                </div>
              )}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="office_phone_number">Office Phone</Label>
            <Input
              id="office_phone_number"
              type="tel"
              {...form.register('office_phone_number')}
            />
            {form.formState.errors.office_phone_number && (
              <p className="text-sm text-red-500">
                {form.formState.errors.office_phone_number.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_person1_name">Primary Contact Person</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                id="contact_person1_name"
                placeholder="Name"
                {...form.register('contact_person1_name')}
              />
              <Input
                placeholder="Phone"
                type="tel"
                {...form.register('contact_person1_phone')}
              />
            </div>
            {form.formState.errors.contact_person1_phone && (
              <p className="text-sm text-red-500">
                {form.formState.errors.contact_person1_phone.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_person2_name">Secondary Contact Person</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                id="contact_person2_name"
                placeholder="Name"
                {...form.register('contact_person2_name')}
              />
              <Input
                placeholder="Phone"
                type="tel"
                {...form.register('contact_person2_phone')}
              />
            </div>
            {form.formState.errors.contact_person2_phone && (
              <p className="text-sm text-red-500">
                {form.formState.errors.contact_person2_phone.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Registered Office Address</h3>
        <AddressForm
          prefix="registered_office_address"
          control={form.control}
          errors={form.formState.errors.registered_office_address}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Billing Address</h3>
          <div className="flex items-center space-x-2">
            <Controller
              name="bill_to_address.same_as_registered"
              control={form.control}
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="same_as_registered"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label htmlFor="same_as_registered">Same as Registered Office</Label>
                </div>
              )}
            />
          </div>
        </div>
        {!billSameAsRegistered && (
          <AddressForm
            prefix="bill_to_address.address"
            control={form.control}
            errors={form.formState.errors.bill_to_address?.address}
          />
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Shipping Address</h3>
          <div className="flex items-center space-x-2">
            <Controller
              name="ship_to_address.same_as_billing"
              control={form.control}
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="same_as_billing"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label htmlFor="same_as_billing">Same as Billing Address</Label>
                </div>
              )}
            />
          </div>
        </div>
        {!shipSameAsBilling && (
          <AddressForm
            prefix="ship_to_address.address"
            control={form.control}
            errors={form.formState.errors.ship_to_address?.address}
          />
        )}
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => form.reset()}
          disabled={isSubmitting}
        >
          Reset
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Client'}
        </Button>
      </div>
    </form>
  );
}