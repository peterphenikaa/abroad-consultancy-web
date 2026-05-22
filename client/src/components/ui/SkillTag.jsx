import React from 'react';
import { Badge } from './badge';

const SkillTag = ({ skill, variant = "default", className, onClick, onRemove }) => {
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