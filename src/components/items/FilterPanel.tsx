import { Condition, CONDITIONS } from '@/types';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useState } from 'react';

interface FilterPanelProps {
  selectedConditions: Condition[];
  onConditionsChange: (conditions: Condition[]) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  maxPrice: number;
}

export function FilterPanel({
  selectedConditions,
  onConditionsChange,
  priceRange,
  onPriceRangeChange,
  maxPrice,
}: FilterPanelProps) {
  const [open, setOpen] = useState(false);

  const handleConditionToggle = (condition: Condition) => {
    if (selectedConditions.includes(condition)) {
      onConditionsChange(selectedConditions.filter((c) => c !== condition));
    } else {
      onConditionsChange([...selectedConditions, condition]);
    }
  };

  const handleClearFilters = () => {
    onConditionsChange([]);
    onPriceRangeChange([0, maxPrice]);
  };

  const hasActiveFilters =
    selectedConditions.length > 0 || priceRange[0] > 0 || priceRange[1] < maxPrice;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 relative"
        >
          <Filter className="h-4 w-4" />
          Filter
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-popover border border-border z-50" align="start">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">Filters</h4>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Condition Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">Condition</Label>
            <div className="space-y-2">
              {CONDITIONS.map((condition) => (
                <div key={condition.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={condition.value}
                    checked={selectedConditions.includes(condition.value)}
                    onCheckedChange={() => handleConditionToggle(condition.value)}
                  />
                  <Label
                    htmlFor={condition.value}
                    className="text-sm font-normal cursor-pointer text-foreground"
                  >
                    {condition.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              Price Range: ${priceRange[0]} - ${priceRange[1]}
            </Label>
            <Slider
              value={priceRange}
              onValueChange={(value) => onPriceRangeChange(value as [number, number])}
              max={maxPrice}
              min={0}
              step={5}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$0</span>
              <span>${maxPrice}</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
