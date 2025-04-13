from typing import List, Callable, Optional, Dict, Any, Union
import functools
import json
import anthropic
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Anthropic client
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def trace(func):
    """Decorator to trace function calls."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        print(f"TRACE: Calling {func.__name__}")
        result = func(*args, **kwargs)
        print(f"TRACE: {func.__name__} returned {result}")
        return result
    return wrapper

def function_tool(func):
    """Decorator to mark functions as tools for agent use."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    wrapper.is_tool = True
    return wrapper

class Agent:
    """Simple agent class that can generate responses and call functions."""
    
    def __init__(self, name: str, instructions: str, tools: List[Callable] = None):
        self.name = name
        self.instructions = instructions
        self.tools = tools or []
        self.handoffs = []
        self.messages = []
        
    def add_message(self, role: str, content: str):
        """Add a message to the conversation history."""
        self.messages.append({"role": role, "content": content})
        
    def generate_response(self, input_message: str) -> str:
        """Generate a response using Anthropic Claude."""
        # Add the input message to history
        self.add_message("user", input_message)
        
        # Prepare the system prompt
        system_prompt = f"You are {self.name}. {self.instructions}"
        
        # Prepare tools for Claude
        tool_schemas = []
        for tool in self.tools:
            if hasattr(tool, "__name__") and hasattr(tool, "is_tool"):
                # Create a basic schema for the tool based on function signature
                schema = {
                    "name": tool.__name__,
                    "description": tool.__doc__ or f"Function {tool.__name__}",
                    "parameters": {
                        "type": "object",
                        "properties": {},
                        "required": []
                    }
                }
                tool_schemas.append(schema)
        
        # Create the conversation history for Claude
        claude_messages = [{"role": "user", "content": input_message}]
        
        try:
            # Call Claude API
            api_params = {
                "model": "claude-3-opus-20240229",
                "system": system_prompt,
                "messages": claude_messages,
                "max_tokens": 2000
            }
            
            # Only add tools parameter if we have tools
            if tool_schemas:
                api_params["tools"] = tool_schemas
            
            response = client.messages.create(**api_params)
            
            # Get the response
            output = response.content[0].text
            
            # Save the response to history
            self.add_message("assistant", output)
            
            # If the response includes tool calls, execute them
            if hasattr(response, "tool_calls") and response.tool_calls:
                for tool_call in response.tool_calls:
                    tool_name = tool_call["name"]
                    tool_args = tool_call["parameters"]
                    
                    # Find the matching tool function
                    tool_func = next((t for t in self.tools if t.__name__ == tool_name), None)
                    if tool_func:
                        # Execute the tool with the provided arguments
                        result = tool_func(**tool_args)
                        
                        # Add the tool response to history
                        result_str = json.dumps(result) if isinstance(result, dict) else str(result)
                        self.add_message("tool", f"Tool {tool_name} returned: {result_str}")
                        
                        # Update the output with the tool response
                        output += f"\n\nTOOL RESPONSE: {result_str}"
            
            return output
            
        except Exception as e:
            error_message = f"Error generating response: {str(e)}"
            print(error_message)
            self.add_message("system", error_message)
            return error_message

class RunnerResult:
    """Object to store the result of a runner execution."""
    
    def __init__(self, final_output: str, agent_name: str):
        self.final_output = final_output
        self.agent_name = agent_name
    
    def __str__(self):
        return self.final_output

class Runner:
    """Runner class to orchestrate agent execution."""
    
    @staticmethod
    def run_sync(starting_agent: Agent, input: str) -> RunnerResult:
        """Run the agent synchronously and return the result."""
        current_agent = starting_agent
        current_input = input
        
        # Process with the current agent
        output = current_agent.generate_response(current_input)
        
        # Check if output contains a handoff instruction
        try:
            result_json = json.loads(output)
            if "handoff_to" in result_json:
                handoff_target = result_json["handoff_to"]
                handoff_message = result_json.get("message", "")
                
                # Find the target agent in handoffs
                next_agent = next(
                    (agent for agent in current_agent.handoffs 
                     if agent.name == handoff_target),
                    None
                )
                
                if next_agent:
                    # Recursively process with the next agent
                    return Runner.run_sync(
                        starting_agent=next_agent,
                        input=handoff_message
                    )
        except (json.JSONDecodeError, KeyError, AttributeError):
            # If output is not valid JSON or doesn't contain handoff info, just return it
            pass
        
        return RunnerResult(final_output=output, agent_name=current_agent.name) 