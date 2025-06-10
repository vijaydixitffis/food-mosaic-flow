import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AddressForm } from './AddressForm';
import { Client, CreateClientDTO, UpdateClientDTO } from '@/types/client';
import { ErrorMessage } from '@hookform/error-message';
import { useDebounce } from 'use-debounce';
import { useClients } from '@/hooks/useClients';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

// Validation schema using Zod
const clientFormSchema = z.object({
  client_code: z.string()
    .min(3, 'Client code must be at least 3 characters')
    .max(20, 'Client code must be at most 20 characters')
    .regex(/^[A-Z0-9_-]+$/i, 'Only letters, numbers, hyphens and underscores are allowed'),
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
    .regex(
      /^[0-9]{10,15}$/,
      'Please enter a valid phone number (10-15 digits)'
    )
    .optional()
    .or(z.literal('')),
  contact_person1_name: z.string().optional(),
  contact_person1_phone: z.string()
    .regex(
      /^[0-9]{10,15}$/,
      'Please enter a valid phone number (10-15 digits)'
    )
    .optional()
    .or(z.literal('')),
  contact_person2_name: z.string().optional(),
  contact_person2_phone: z.string()
    .regex(
      /^[0-9]{10,15}$/,
      'Please enter a valid phone number (10-15 digits)'
    )
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
  }).optional(),
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
  }).optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  initialData?: Client | null;
  onSubmit: (data: Omit<CreateClientDTO, 'id'> | Omit<UpdateClientDTO, 'id'>) => Promise<void>;
  isSubmitting?: boolean;
}

export function ClientForm({ initialData, onSubmit, isSubmitting = false }: ClientFormProps) {
  const { checkClientCode } = useClients();
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [codeAvailable, setCodeAvailable] = useState<boolean | null>(null);
  
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      client_code: initialData?.client_code || '',
      name: initialData?.name || '',
      gst_number: initialData?.gst_number || '',
      is_igst: initialData?.is_igst || false,
      company_registration_number: initialData?.company_registration_number || '',
      office_phone_number: initialData?.office_phone_number || '',
      contact_person1_name: initialData?.contact_person1_name || '',
      contact_person1_phone: initialData?.contact_person1_phone || '',
      contact_person2_name: initialData?.contact_person2_name || '',
      contact_person2_phone: initialData?.contact_person2_phone || '',
      registered_office_address: {
        address_line1: initialData?.registered_office_address?.address_line1 || '',
        address_line2: initialData?.registered_office_address?.address_line2 || '',
        landmark: initialData?.registered_office_address?.landmark || '',
        city: initialData?.registered_office_address?.city || '',
        state: initialData?.registered_office_address?.state || '',
        pincode: initialData?.registered_office_address?.pincode || '',
      },
      bill_to_address: {
        same_as_registered: true,
        address: initialData?.bill_to_address_id ? {
          address_line1: initialData.bill_to_address?.address_line1 || '',
          address_line2: initialData.bill_to_address?.address_line2 || '',
          landmark: initialData.bill_to_address?.landmark || '',
          city: initialData.bill_to_address?.city || '',
          state: initialData.bill_to_address?.state || '',
          pincode: initialData.bill_to_address?.pincode || '',
        } : undefined,
      },
      ship_to_address: {
        same_as_billing: true,
        address: initialData?.ship_to_address_id ? {
          address_line1: initialData.ship_to_address?.address_line1 || '',
          address_line2: initialData.ship_to_address?.address_line2 || '',
          landmark: initialData.ship_to_address?.landmark || '',
          city: initialData.ship_to_address?.city || '',
          state: initialData.ship_to_address?.state || '',
          pincode: initialData.ship_to_address?.pincode || '',
        } : undefined,
      },
    },
  });

  // Watch form values
  const clientCode = useWatch({ control: form.control, name: 'client_code' });
  const billToSameAsRegistered = useWatch({ 
    control: form.control, 
    name: 'bill_to_address.same_as_registered' 
  });
  const shipToSameAsBilling = useWatch({ 
    control: form.control, 
    name: 'ship_to_address.same_as_billing' 
  });

  // Debounce client code check
  const [debouncedClientCode] = useDebounce(clientCode, 500);

  // Check if client code is available
  useEffect(() => {
    const checkCode = async () => {
      if (!debouncedClientCode || debouncedClientCode.length < 3) {
        setCodeAvailable(null);
        return;
      }

      setIsCheckingCode(true);
      try {
        const isAvailable = await checkClientCode.mutateAsync({
          code: debouncedClientCode,
          excludeId: initialData?.id,
        });
        setCodeAvailable(isAvailable);
      } catch (error) {
        setCodeAvailable(false);
      } finally {
        setIsCheckingCode(false);
      }
    };

    checkCode();
  }, [debouncedClientCode, initialData?.id, checkClientCode]);

  // Handle form submission
  const handleSubmit = async (data: ClientFormValues) => {
    if (isCheckingCode || codeAvailable === false) {
      return;
    }

    // Prepare the data for submission
    const submitData: any = {
      ...data,
      // Clean up empty strings
      gst_number: data.gst_number || null,
      company_registration_number: data.company_registration_number || null,
      office_phone_number: data.office_phone_number || null,
      contact_person1_name: data.contact_person1_name || null,
      contact_person1_phone: data.contact_person1_phone || null,
      contact_person2_name: data.contact_person2_name || null,
      contact_person2_phone: data.contact_person2_phone || null,
    };

    // Handle addresses based on "same as" checkboxes
    if (billToSameAsRegistered) {
      submitData.bill_to_address = {
        ...data.registered_office_address,
        same_as_registered: true
      };
    } else if (data.bill_to_address?.address) {
      submitData.bill_to_address = {
        ...data.bill_to_address.address,
        same_as_registered: false
      };
    }

    if (shipToSameAsBilling) {
      submitData.ship_to_address = {
        ...(billToSameAsRegistered 
          ? data.registered_office_address 
          : data.bill_to_address?.address || data.registered_office_address
        ),
        same_as_billing: true
      };
    } else if (data.ship_to_address?.address) {
      submitData.ship_to_address = {
        ...data.ship_to_address.address,
        same_as_billing: false
      };
    }

    await onSubmit(submitData);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Client Code */}
          <div className="space-y-2">
            <Label htmlFor="client_code">Client Code *</Label>
            <div className="relative">
              <Input
                id="client_code"
                placeholder="Enter client code"
                {...form.register('client_code')}
                className={codeAvailable === false ? 'border-red-500' : ''}
              />
              {isCheckingCode && (
                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {codeAvailable === false && !isCheckingCode && (
                <span className="absolute right-3 top-2.5 text-sm text-red-500">Code not available</span>
              )}
              {codeAvailable === true && !isCheckingCode && (
                <span className="absolute right-3 top-2.5 text-sm text-green-500">✓ Available</span>
              )}
            </div>
            <ErrorMessage
              errors={form.formState.errors}
              name="client_code"
              render={({ message }) => (
                <p className="text-sm text-red-500">{message}</p>
              )}
            />
          </div>

          {/* Client Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Client Name *</Label>
            <Input
              id="name"
              placeholder="Enter client name"
              {...form.register('name')}
            />
            <ErrorMessage
              errors={form.formState.errors}
              name="name"
              render={({ message }) => (
                <p className="text-sm text-red-500">{message}</p>
              )}
            />
          </div>

          {/* GST Number */}
          <div className="space-y-2">
            <Label htmlFor="gst_number">GST Number</Label>
            <Input
              id="gst_number"
              placeholder="22AAAAA0000A1Z5"
              {...form.register('gst_number')}
            />
            <ErrorMessage
              errors={form.formState.errors}
              name="gst_number"
              render={({ message }) => (
                <p className="text-sm text-red-500">{message}</p>
              )}
            />
          </div>

          {/* Company Registration */}
          <div className="space-y-2">
            <Label htmlFor="company_registration_number">Company Registration</Label>
            <Input
              id="company_registration_number"
              placeholder="Company registration number"
              {...form.register('company_registration_number')}
            />
          </div>

          {/* Office Phone */}
          <div className="space-y-2">
            <Label htmlFor="office_phone_number">Office Phone</Label>
            <Input
              id="office_phone_number"
              placeholder="Office phone number"
              {...form.register('office_phone_number')}
            />
            <ErrorMessage
              errors={form.formState.errors}
              name="office_phone_number"
              render={({ message }) => (
                <p className="text-sm text-red-500">{message}</p>
              )}
            />
          </div>

          {/* IGST Checkbox */}
          <div className="flex items-center space-x-2 pt-6">
            <Checkbox
              id="is_igst"
              {...form.register('is_igst')}
            />
            <Label htmlFor="is_igst">IGST Applicable</Label>
          </div>
        </div>
      </div>

      {/* Contact Persons */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Contact Persons</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primary Contact */}
          <div className="space-y-2">
            <Label>Primary Contact</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Name"
                {...form.register('contact_person1_name')}
              />
              <Input
                placeholder="Phone"
                type="tel"
                {...form.register('contact_person1_phone')}
              />
            </div>
            <ErrorMessage
              errors={form.formState.errors}
              name="contact_person1_phone"
              render={({ message }) => (
                <p className="text-sm text-red-500">{message}</p>
              )}
            />
          </div>

          {/* Secondary Contact */}
          <div className="space-y-2">
            <Label>Secondary Contact</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Name"
                {...form.register('contact_person2_name')}
              />
              <Input
                placeholder="Phone"
                type="tel"
                {...form.register('contact_person2_phone')}
              />
            </div>
            <ErrorMessage
              errors={form.formState.errors}
              name="contact_person2_phone"
              render={({ message }) => (
                <p className="text-sm text-red-500">{message}</p>
              )}
            />
          </div>
        </div>
      </div>

      {/* Registered Office Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Registered Office Address</h3>
        <AddressForm
          control={form.control}
          errors={form.formState.errors}
          prefix="registered_office_address"
        />
      </div>

      {/* Billing Address */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Billing Address</h3>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="same_as_registered"
              checked={billToSameAsRegistered}
              onCheckedChange={(checked) => {
                form.setValue('bill_to_address.same_as_registered', !!checked);
                if (checked) {
                  form.clearErrors('bill_to_address.address');
                }
              }}
            />
            <Label htmlFor="same_as_registered">Same as Registered Office</Label>
          </div>
        </div>
        {!billToSameAsRegistered && (
          <AddressForm
            control={form.control}
            errors={form.formState.errors}
            prefix="bill_to_address.address"
          />
        )}
      </div>

      {/* Shipping Address */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Shipping Address</h3>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="same_as_billing"
              checked={shipToSameAsBilling}
              onCheckedChange={(checked) => {
                form.setValue('ship_to_address.same_as_billing', !!checked);
                if (checked) {
                  form.clearErrors('ship_to_address.address');
                }
              }}
            />
            <Label htmlFor="same_as_billing">Same as Billing Address</Label>
          </div>
        </div>
        {!shipToSameAsBilling && (
          <AddressForm
            control={form.control}
            errors={form.formState.errors}
            prefix="ship_to_address.address"
          />
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || isCheckingCode || codeAvailable === false}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {initialData ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>{initialData ? 'Update Client' : 'Create Client'}</>
          )}
        </Button>
      </div>
    </form>
  );
}