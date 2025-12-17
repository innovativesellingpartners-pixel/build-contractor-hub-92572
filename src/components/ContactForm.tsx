import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Phone, User, Building, MessageSquare } from "lucide-react";
import ct1Logo from "@/assets/ct1-round-logo-new.png";
import { FormNavigation } from "./FormNavigation";

const contactFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50, "First name must be less than 50 characters"),
  lastName: z.string().trim().min(1, "Last name is required").max(50, "Last name must be less than 50 characters"),
  companyName: z.string().trim().min(1, "Company name is required").max(100, "Company name must be less than 100 characters"),
  phone: z.string().trim().min(1, "Phone number is required").max(20, "Phone number must be less than 20 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  reason: z.string().trim().max(1000, "Reason must be less than 1000 characters").optional(),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
  title?: string;
  description?: string;
  ctaText?: string;
  onClose?: () => void;
  formType?: string;
}

export function ContactForm({ 
  title = "Get Started with CT1", 
  description = "Join thousands of contractors growing their business with CT1",
  ctaText = "Send Message",
  onClose,
  formType = "general"
}: ContactFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      companyName: "",
      phone: "",
      email: "",
      reason: "",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/functions/v1/send-contact-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          formType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      toast({
        title: "Message Sent!",
        description: "Thank you for your interest in CT1. Our sales team will contact you shortly.",
      });

      form.reset();
      onClose?.();
    } catch (error) {
      console.error("Error sending contact form:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please contact us directly at sales@myct1.com",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto card-ct1">
      <CardHeader className="text-center">
        <FormNavigation className="mb-4" />
        <div className="flex justify-center mb-4">
          <img src={ct1Logo} alt="CT1 Logo" className="h-16 w-16" />
        </div>
        <CardTitle className="text-2xl font-bold text-foreground">{title}</CardTitle>
        <p className="text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                First Name *
              </Label>
              <Input
                id="firstName"
                {...form.register("firstName")}
                placeholder="Enter your first name"
                className="w-full"
              />
              {form.formState.errors.firstName && (
                <p className="text-destructive text-sm">{form.formState.errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Last Name *
              </Label>
              <Input
                id="lastName"
                {...form.register("lastName")}
                placeholder="Enter your last name"
                className="w-full"
              />
              {form.formState.errors.lastName && (
                <p className="text-destructive text-sm">{form.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-sm font-medium flex items-center gap-2">
              <Building className="h-4 w-4" />
              Company Name *
            </Label>
            <Input
              id="companyName"
              {...form.register("companyName")}
              placeholder="Enter your company name"
              className="w-full"
            />
            {form.formState.errors.companyName && (
              <p className="text-destructive text-sm">{form.formState.errors.companyName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number *
            </Label>
            <Input
              id="phone"
              {...form.register("phone")}
              placeholder="Enter your phone number"
              className="w-full"
            />
            {form.formState.errors.phone && (
              <p className="text-destructive text-sm">{form.formState.errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="Enter your email address"
              className="w-full"
            />
            {form.formState.errors.email && (
              <p className="text-destructive text-sm">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Reason for Inquiry
            </Label>
            <Textarea
              id="reason"
              {...form.register("reason")}
              placeholder="Tell us how we can help you (optional)"
              className="w-full min-h-[80px]"
            />
            {form.formState.errors.reason && (
              <p className="text-destructive text-sm">{form.formState.errors.reason.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full btn-ct1" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              ctaText
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}