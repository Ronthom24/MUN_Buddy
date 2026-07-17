"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoBadge } from "@/components/logo";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { ApiRequestError } from "@/lib/api";

const schema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(6, "At least 6 characters"),
    confirmPassword: z.string(),
    organizationName: z.string().optional(),
    conferenceName: z.string().min(2, "Enter a conference name"),
    conferenceAcronym: z.string().optional(),
    startDate: z.string().min(1, "Required"),
    endDate: z.string().min(1, "Required"),
    registrationDeadline: z.string().min(1, "Required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerOrganizer } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const { organization, conference } = await registerOrganizer(values);
      toast.success(`${organization.name} created`, {
        description: `${conference.name} is ready in your dashboard.`,
      });
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Something went wrong";
      toast.error("Registration failed", { description: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-gradient-to-b from-brand-navy/5 to-background px-4 py-12">
      <Card className="w-full max-w-xl shadow-lg">
        <CardHeader className="text-center">
          <LogoBadge size={72} className="mx-auto mb-2" />
          <CardTitle className="text-2xl font-semibold">Create your organization</CardTitle>
          <CardDescription>
            Register as an organizer and set up your first conference in one step.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Your account</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" {...register("fullName")} />
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register("email")} />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" {...register("password")} />
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="organizationName">Organization name (optional)</Label>
                  <Input id="organizationName" placeholder="Christ University MUN Society" {...register("organizationName")} />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Your first conference</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="conferenceName">Conference name</Label>
                  <Input id="conferenceName" placeholder="Christ MUN 2027" {...register("conferenceName")} />
                  {errors.conferenceName && (
                    <p className="text-sm text-destructive">{errors.conferenceName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conferenceAcronym">Acronym</Label>
                  <Input id="conferenceAcronym" placeholder="CMUN27" {...register("conferenceAcronym")} />
                </div>
                <div />
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start date</Label>
                  <Input id="startDate" type="date" {...register("startDate")} />
                  {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End date</Label>
                  <Input id="endDate" type="date" {...register("endDate")} />
                  {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="registrationDeadline">Registration deadline</Label>
                  <Input id="registrationDeadline" type="date" {...register("registrationDeadline")} />
                  {errors.registrationDeadline && (
                    <p className="text-sm text-destructive">{errors.registrationDeadline.message}</p>
                  )}
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Creating..." : "Create organization & conference"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
