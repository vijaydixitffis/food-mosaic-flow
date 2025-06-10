import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ErrorMessage } from '@hookform/error-message';
import { Control, useFormContext, Controller } from 'react-hook-form';

interface AddressFormProps {
  prefix: string;
  control?: Control<any>;
  errors?: any;
}

export function AddressForm({ prefix, control, errors: propErrors }: AddressFormProps) {
  const form = useFormContext();
  const { register, formState: { errors: formErrors } } = form || {};
  
  // Use prop errors if provided, otherwise use form errors
  const errors = propErrors || formErrors;
  
  const getFieldName = (field: string) => {
    return prefix ? `${prefix}.${field}` : field;
  };
  
  // If control is provided, use it with Controller
  const FormInput = ({ name, ...props }: { name: string; [key: string]: any }) => {
    if (control) {
      return (
        <Controller
          control={control}
          name={getFieldName(name)}
          render={({ field }) => (
            <Input {...field} {...props} />
          )}
        />
      );
    }
    return <Input {...register(getFieldName(name))} {...props} />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor={getFieldName('address_line1')}>Address Line 1 *</Label>
        <FormInput
          id={getFieldName('address_line1')}
          name="address_line1"
        />
        <ErrorMessage
          errors={errors}
          name={getFieldName('address_line1')}
          render={({ message }) => (
            <p className="text-sm text-red-500">{message}</p>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={getFieldName('address_line2')}>Address Line 2</Label>
        <FormInput
          id={getFieldName('address_line2')}
          name="address_line2"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={getFieldName('landmark')}>Landmark</Label>
        <FormInput
          id={getFieldName('landmark')}
          name="landmark"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={getFieldName('city')}>City *</Label>
        <FormInput
          id={getFieldName('city')}
          name="city"
        />
        <ErrorMessage
          errors={errors}
          name={getFieldName('city')}
          render={({ message }) => (
            <p className="text-sm text-red-500">{message}</p>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={getFieldName('state')}>State *</Label>
        <FormInput
          id={getFieldName('state')}
          name="state"
        />
        <ErrorMessage
          errors={errors}
          name={getFieldName('state')}
          render={({ message }) => (
            <p className="text-sm text-red-500">{message}</p>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={getFieldName('pincode')}>Pincode *</Label>
        <FormInput
          id={getFieldName('pincode')}
          name="pincode"
        />
        <ErrorMessage
          errors={errors}
          name={getFieldName('pincode')}
          render={({ message }) => (
            <p className="text-sm text-red-500">{message}</p>
          )}
        />
      </div>
    </div>
  );
}
