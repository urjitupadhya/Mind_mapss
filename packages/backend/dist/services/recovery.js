export async function generateRecoverySuggestions(context) {
    const suggestions = [];
    if (context.strainLevel === 'critical' || context.burnoutProbability > 75) {
        suggestions.push({
            immediate: {
                type: 'cognitive_reset',
                title: 'Immediate Cognitive Break',
                description: 'Step away from the screen. Take 3 deep breaths.',
                duration: '30 seconds'
            },
            shortTerm: {
                type: 'physical_reset',
                title: 'Physical Movement',
                description: 'Walk around for 5-10 minutes. Get some fresh air.',
                duration: '10 minutes'
            },
            strategic: {
                type: 'session_end',
                title: 'End Session',
                description: 'Consider ending for today. Your cognitive resources are depleted.',
            }
        });
    }
    else if (context.strainLevel === 'high' || context.burnoutProbability > 50) {
        suggestions.push({
            immediate: {
                type: 'stretch_break',
                title: 'Quick Stretch',
                description: 'Stand up, stretch your arms, neck, and shoulders.',
                duration: '1 minute'
            },
            shortTerm: {
                type: 'task_downgrade',
                title: 'Switch to Low-Cognitive Task',
                description: 'Move to documentation, code review, or planning instead of new features.',
                duration: 'Until strain reduces'
            },
            strategic: {
                type: 'early_end',
                title: 'Early Day End',
                description: 'Consider wrapping up early to recover for tomorrow.',
            }
        });
    }
    else if (context.strainLevel === 'moderate' || context.burnoutProbability > 30) {
        if (context.sessionDuration > 90) {
            suggestions.push({
                immediate: {
                    type: 'micro_break',
                    title: 'Micro Break',
                    description: 'Look away from screen. Focus on something 20 feet away.',
                    duration: '20 seconds'
                },
                shortTerm: {
                    type: 'social_reset',
                    title: 'Social Check-in',
                    description: 'Message a teammate or take a quick coffee break.',
                    duration: '15 minutes'
                },
                strategic: {
                    type: 'pace_yourself',
                    title: 'Pace Your Session',
                    description: 'Plan to end in the next hour. You\'ve been at it a while.',
                }
            });
        }
        else {
            suggestions.push({
                immediate: {
                    type: 'posture_check',
                    title: 'Posture Check',
                    description: 'Sit up straight, relax your shoulders.',
                    duration: '10 seconds'
                },
                shortTerm: {
                    type: 'hydration',
                    title: 'Hydration Break',
                    description: 'Get some water. Dehydration affects cognitive performance.',
                    duration: '5 minutes'
                },
                strategic: {
                    type: 'maintain_awareness',
                    title: 'Stay Aware',
                    description: 'Your strain is manageable but monitor it.',
                }
            });
        }
    }
    else {
        suggestions.push({
            immediate: {
                type: 'continue',
                title: 'You\'re Doing Great',
                description: 'Keep up the good work! Stay mindful of your energy.',
                duration: 'Ongoing'
            },
            shortTerm: {
                type: 'schedule_break',
                title: 'Plan Your Break',
                description: 'Schedule a short break in the next hour to maintain this state.',
                duration: 'In 45-60 mins'
            },
            strategic: {
                type: 'protect_this_state',
                title: 'Protect Your Flow',
                description: 'This is a productive state. Guard it from interruptions.',
            }
        });
    }
    const recoveryType = getRecoveryType(context);
    return {
        strainLevel: context.strainLevel,
        recoveryType,
        suggestions,
        personalizedMessage: generatePersonalizedMessage(context),
        estimatedRecoveryTime: getEstimatedRecoveryTime(context)
    };
}
function getRecoveryType(context) {
    if (context.errorRate > 0.3)
        return 'cognitive_overload';
    if (context.fileSwitchRate > 0.5)
        return 'context_switching';
    if (context.strainLevel === 'critical')
        return 'exhaustion';
    if (context.strainLevel === 'high')
        return 'fatigue';
    if (context.burnoutProbability > 50)
        return 'burnout_risk';
    return 'maintenance';
}
function generatePersonalizedMessage(context) {
    const hour = context.hourOfDay;
    let timeContext = '';
    if (hour >= 22 || hour < 6)
        timeContext = 'late night';
    else if (hour >= 18 && hour < 22)
        timeContext = 'evening';
    else if (hour >= 12 && hour < 14)
        timeContext = 'post-lunch';
    else if (hour >= 9 && hour < 12)
        timeContext = 'morning';
    else
        timeContext = 'afternoon';
    if (context.strainLevel === 'critical') {
        return `Your cognitive load is critically high right now, especially during ${timeContext} coding. Please take an immediate break for your wellbeing.`;
    }
    else if (context.strainLevel === 'high') {
        return `You're showing signs of strain after ${Math.round(context.sessionDuration)} minutes of coding this ${timeContext}. A break would help prevent burnout.`;
    }
    else if (context.strainLevel === 'moderate') {
        return `Your cognitive state is manageable but not optimal for ${timeContext}. Consider a short break to maintain productivity.`;
    }
    else {
        return `You're in a good cognitive state for ${timeContext} coding. Keep it up!`;
    }
}
function getEstimatedRecoveryTime(context) {
    if (context.strainLevel === 'critical')
        return '30-60 minutes';
    if (context.strainLevel === 'high')
        return '15-30 minutes';
    if (context.strainLevel === 'moderate')
        return '5-15 minutes';
    return 'Already in good state';
}
