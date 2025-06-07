
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, MoveUp, MoveDown } from 'lucide-react';

interface RecipeInstruction {
  id?: string;
  sequence_number: number;
  instruction_text: string;
}

interface RecipeInstructionsTabProps {
  instructions: RecipeInstruction[];
  onInstructionsChange: (instructions: RecipeInstruction[]) => void;
  isReadOnly: boolean;
}

export function RecipeInstructionsTab({
  instructions,
  onInstructionsChange,
  isReadOnly,
}: RecipeInstructionsTabProps) {
  const addInstruction = () => {
    const newInstruction: RecipeInstruction = {
      sequence_number: instructions.length + 1,
      instruction_text: '',
    };
    onInstructionsChange([...instructions, newInstruction]);
  };

  const removeInstruction = (index: number) => {
    const newInstructions = instructions.filter((_, i) => i !== index);
    // Resequence the remaining instructions
    const resequenced = newInstructions.map((inst, i) => ({
      ...inst,
      sequence_number: i + 1,
    }));
    onInstructionsChange(resequenced);
  };

  const updateInstruction = (index: number, text: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = {
      ...newInstructions[index],
      instruction_text: text,
    };
    onInstructionsChange(newInstructions);
  };

  const moveInstruction = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === instructions.length - 1)
    ) {
      return;
    }

    const newInstructions = [...instructions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap the instructions
    [newInstructions[index], newInstructions[targetIndex]] = 
    [newInstructions[targetIndex], newInstructions[index]];
    
    // Update sequence numbers
    newInstructions[index].sequence_number = index + 1;
    newInstructions[targetIndex].sequence_number = targetIndex + 1;
    
    onInstructionsChange(newInstructions);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Recipe Instructions * (Sequential steps)</Label>
        {!isReadOnly && (
          <Button type="button" onClick={addInstruction} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Step
          </Button>
        )}
      </div>

      {instructions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {isReadOnly 
            ? 'No instructions available' 
            : 'No instructions yet. Click "Add Step" to create your first instruction.'
          }
        </div>
      ) : (
        <div className="space-y-3">
          {instructions.map((instruction, index) => (
            <Card key={index} className="relative">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    {instruction.sequence_number}
                  </div>
                  
                  <div className="flex-1">
                    <Textarea
                      value={instruction.instruction_text}
                      onChange={(e) => updateInstruction(index, e.target.value)}
                      placeholder={`Enter instruction for step ${instruction.sequence_number}`}
                      disabled={isReadOnly}
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  {!isReadOnly && (
                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveInstruction(index, 'up')}
                        disabled={index === 0}
                        className="h-8 w-8 p-0"
                      >
                        <MoveUp className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveInstruction(index, 'down')}
                        disabled={index === instructions.length - 1}
                        className="h-8 w-8 p-0"
                      >
                        <MoveDown className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeInstruction(index)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
