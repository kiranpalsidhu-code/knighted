import React, { useState } from "react";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { SKILL_CATEGORIES } from "@/lib/skillsList";

interface SkillsAutocompleteProps {
  onInsert: (skill: string) => void;
}

export function SkillsAutocomplete({ onInsert }: SkillsAutocompleteProps) {
  const [open, setOpen] = useState(false);

  function handleSelect(skill: string) {
    onInsert(skill);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" title="Insert a skill">
          <Wand2 className="w-4 h-4 mr-2" /> Skills
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-0"
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <Command>
          <CommandInput placeholder="Search skills…" />
          <CommandList className="max-h-72">
            <CommandEmpty>No skills found.</CommandEmpty>
            {SKILL_CATEGORIES.map((category) => (
              <CommandGroup key={category.label} heading={category.label}>
                {category.skills.map((skill) => (
                  <CommandItem
                    key={skill}
                    value={skill}
                    onSelect={() => handleSelect(skill)}
                    className="cursor-pointer"
                  >
                    {skill}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
