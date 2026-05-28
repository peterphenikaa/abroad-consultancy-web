import React from 'react';
import { Badge } from './badge';

interface Skill {
    id: number | string;
    name: string;
}

interface SkillTagProps {
    skill: Skill;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
    onClick?: () => void;
    onRemove?: (skill: Skill) => void;
}

const SkillTag = ({ skill, variant = "default", className, onClick, onRemove }: SkillTagProps) => {
    return (
        <Badge
            variant={variant}
            className={`cursor-default ${onClick ? 'cursor-pointer hover:bg-primary/80' : ''} ${className}`}
            onClick={onClick}
        >
            {skill.name}
            {onRemove && (
                <button
                    className="ml-2 text-current hover:text-red-500 focus:outline-none"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(skill);
                    }}
                >
                    &times;
                </button>
            )}
        </Badge>
    );
};

export default SkillTag;