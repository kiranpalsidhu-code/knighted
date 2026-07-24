import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { Navbar } from "@/components/layout/Navbar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateKnightedListing } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Briefcase, MapPin, DollarSign, CheckCircle2, Search } from "lucide-react";

const POST_TITLE_SUGGESTIONS = [
  "Software Engineer","Senior Software Engineer","Staff Engineer","Principal Engineer",
  "Frontend Engineer","Backend Engineer","Full Stack Engineer","DevOps Engineer",
  "Site Reliability Engineer","Platform Engineer","Machine Learning Engineer",
  "Data Engineer","Data Scientist","Data Analyst","Analytics Engineer",
  "Product Manager","Senior Product Manager","Director of Product","VP of Product",
  "Product Designer","UX Designer","UI Designer","Head of Design",
  "Engineering Manager","VP of Engineering","CTO","Director of Engineering",
  "Investment Banking Analyst","Private Equity Associate","Quantitative Analyst",
  "Financial Analyst","Corporate Finance Manager","Risk Analyst",
  "Management Consultant","Strategy Consultant","Business Analyst",
  "Marketing Manager","Growth Manager","Head of Marketing","CMO",
  "Sales Engineer","Account Executive","VP of Sales","Business Development Manager",
  "HR Business Partner","Head of People","Talent Acquisition Manager",
  "Operations Manager","Chief of Staff","Project Manager","Program Manager",
  "Legal Counsel","Compliance Manager","Associate","Partner",
  "Research Scientist","Postdoctoral Researcher","Lecturer",
  "Communications Manager","PR Manager","Social Media Manager",
];

const jobSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  company: z.string().min(1, "Company name is required."),
  companyWebsite: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  location: z.string().min(1, "Location is required."),
  isRemote: z.boolean().default(false),
  employmentType: z.enum(["full_time", "part_time", "contract", "internship"]),
  salaryMin: z.coerce.number().optional().or(z.literal("")),
  salaryMax: z.coerce.number().optional().or(z.literal("")),
  salaryCurrency: z.string().default("USD"),
  category: z.string().optional(),
  description: z.string().min(50, "Description must be at least 50 characters long."),
  applyUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  contactEmail: z.string().email("Must be a valid email address.")
}).refine(data => {
  if (data.salaryMin && data.salaryMax) {
    return Number(data.salaryMax) >= Number(data.salaryMin);
  }
  return true;
}, {
  message: "Maximum salary must be greater than or equal to minimum salary",
  path: ["salaryMax"]
}).refine(data => data.applyUrl || data.contactEmail, {
  message: "Provide either an Apply URL or a Contact Email",
  path: ["applyUrl"]
});

export function PostJob() {
  useSEO({
    title: "Post a Job — Reach Ambitious Professionals on Knighted Jobs",
    description: "List your role directly on Knighted Jobs. No recruiter middlemen. Reach finance, consulting, legal, and engineering candidates who apply through your careers page.",
    canonical: "/post-a-job",
  });
  const { toast } = useToast();
  const [successId, setSuccessId] = useState<number | null>(null);
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);
  const [titleSugs, setTitleSugs] = useState<string[]>([]);
  const [showTitleSugs, setShowTitleSugs] = useState(false);
  const titleContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (titleContainerRef.current && !titleContainerRef.current.contains(e.target as Node))
        setShowTitleSugs(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  
  const form = useForm<z.infer<typeof jobSchema>>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      company: "",
      companyWebsite: "",
      location: "",
      isRemote: false,
      employmentType: "full_time",
      salaryMin: undefined,
      salaryMax: undefined,
      salaryCurrency: "USD",
      category: "",
      description: "",
      applyUrl: "",
      contactEmail: ""
    }
  });

  const createListing = useCreateKnightedListing({
    mutation: {
      onSuccess: (data) => {
        setSuccessId(data.id);
        setReviewUrl((data as any).reviewUrl ?? null);
        toast({
          title: "Job posted successfully",
          description: "Your listing is now live on Knighted Jobs.",
        });
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Failed to post job",
          description: "Please check your inputs and try again.",
        });
        console.error(err);
      }
    }
  });

  const onSubmit = (values: z.infer<typeof jobSchema>) => {
    // clean up empty string optionals
    const payload = {
      ...values,
      companyWebsite: values.companyWebsite || undefined,
      salaryMin: values.salaryMin ? Number(values.salaryMin) : undefined,
      salaryMax: values.salaryMax ? Number(values.salaryMax) : undefined,
      applyUrl: values.applyUrl || undefined,
      category: values.category || undefined,
    };
    
    createListing.mutate({ data: payload });
  };

  if (successId) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container max-w-2xl py-20 flex flex-col items-center text-center">
          <div className="h-20 w-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-bold mb-4">Job Posted Successfully!</h1>
          <p className="text-muted-foreground mb-8 max-w-md text-lg">
            Your role is now live and visible to ambitious professionals seeking their next big move.
          </p>
          {reviewUrl && (
            <div className="w-full max-w-lg bg-card border border-primary/30 rounded-xl p-5 mb-8 text-left">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-semibold text-foreground">Your private applicant review link</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Share this URL with no one — it lets you view and score all applicants with AI.</p>
              <div className="flex items-center gap-2 bg-background rounded-lg border border-border p-3 font-mono text-xs text-muted-foreground break-all">
                {reviewUrl}
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => navigator.clipboard.writeText(reviewUrl)}>
                Copy Review Link
              </Button>
            </div>
          )}
          <div className="flex gap-4">
            <Button asChild size="lg">
              <Link href={`/jobs/${successId}`}>View Listing</Link>
            </Button>
            <Button variant="outline" size="lg" onClick={() => {
              form.reset();
              setSuccessId(null);
              setReviewUrl(null);
            }}>
              Post Another Job
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container max-w-3xl py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-3 text-foreground">Post a Job</h1>
          <p className="text-muted-foreground text-lg">
            Reach a curated network of highly motivated professionals. Straightforward, effective, no dark patterns.
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 md:p-8 shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="space-y-6">
                <h2 className="text-xl font-semibold border-b border-border pb-2 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" /> Role Details
                </h2>
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title *</FormLabel>
                      <FormControl>
                        <div ref={titleContainerRef} className="relative">
                          <Input
                            {...field}
                            placeholder="e.g. Senior Product Manager"
                            className="bg-background"
                            autoComplete="off"
                            onChange={e => {
                              field.onChange(e);
                              const v = e.target.value;
                              if (v.length >= 1) {
                                const matches = POST_TITLE_SUGGESTIONS
                                  .filter(t => t.toLowerCase().includes(v.toLowerCase()))
                                  .slice(0, 6);
                                setTitleSugs(matches);
                                setShowTitleSugs(matches.length > 0);
                              } else {
                                setShowTitleSugs(false);
                              }
                            }}
                            onFocus={() => { if (titleSugs.length > 0) setShowTitleSugs(true); }}
                          />
                          {showTitleSugs && (
                            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                              {titleSugs.map(s => (
                                <button key={s} type="button"
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/10 hover:text-primary flex items-center gap-2 transition-colors"
                                  onMouseDown={e => { e.preventDefault(); field.onChange(s); setShowTitleSugs(false); }}>
                                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />{s}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="employmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employment Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="full_time">Full-time</SelectItem>
                            <SelectItem value="part_time">Part-time</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="internship">Internship</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {["Finance","Consulting","Legal","Technology","Engineering","Energy","Operations","Healthcare","Public Sector","Social Work","Psychology","Communications","Arts & Culture","Academia","Data & AI","Product","Marketing","Sales","People & HR"].map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. New York, NY" className="bg-background" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isRemote"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border bg-background p-4 h-10 items-center">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer">This role allows remote work</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="salaryMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Salary</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="number" placeholder="80000" className="pl-9 bg-background" {...field} value={field.value || ''} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="salaryMax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Salary</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="number" placeholder="120000" className="pl-9 bg-background" {...field} value={field.value || ''} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="salaryCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD – US Dollar</SelectItem>
                            <SelectItem value="GBP">GBP – British Pound</SelectItem>
                            <SelectItem value="EUR">EUR – Euro</SelectItem>
                            <SelectItem value="CAD">CAD – Canadian Dollar</SelectItem>
                            <SelectItem value="AUD">AUD – Australian Dollar</SelectItem>
                            <SelectItem value="SGD">SGD – Singapore Dollar</SelectItem>
                            <SelectItem value="HKD">HKD – Hong Kong Dollar</SelectItem>
                            <SelectItem value="AED">AED – UAE Dirham</SelectItem>
                            <SelectItem value="CHF">CHF – Swiss Franc</SelectItem>
                            <SelectItem value="JPY">JPY – Japanese Yen</SelectItem>
                            <SelectItem value="KRW">KRW – South Korean Won</SelectItem>
                            <SelectItem value="MYR">MYR – Malaysian Ringgit</SelectItem>
                            <SelectItem value="INR">INR – Indian Rupee</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the role, responsibilities, requirements, and ideal candidate background..." 
                          className="min-h-[200px] bg-background resize-y" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>Minimum 50 characters. Include specific skills and seniority level to attract the right candidates.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 flex gap-3 items-start">
                  <DollarSign className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Salary disclosure is strongly recommended</p>
                    <p className="text-xs text-muted-foreground mt-1">100% of KnightedJobs listings show salary. Roles with disclosed pay receive significantly more qualified applications. You can enter a range (e.g. 80,000–120,000).</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-xl font-semibold border-b border-border pb-2 flex items-center gap-2 mt-8">
                  <Building className="h-5 w-5 text-primary" /> Company Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Acme Corp" className="bg-background" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyWebsite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://acmecorp.com" className="bg-background" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-xl font-semibold border-b border-border pb-2 flex items-center gap-2 mt-8">
                  <MapPin className="h-5 w-5 text-primary" /> Application Routing
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="applyUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>External Apply URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://jobs.lever.co/..." className="bg-background" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormDescription>Where should applicants go to apply?</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="recruiting@acmecorp.com" className="bg-background" {...field} />
                        </FormControl>
                        <FormDescription>Used for fallback application and support.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-border flex justify-end">
                <Button type="submit" size="lg" className="w-full md:w-auto px-10 text-lg font-medium" disabled={createListing.isPending}>
                  {createListing.isPending ? "Posting..." : "Post Job"}
                </Button>
              </div>

            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
