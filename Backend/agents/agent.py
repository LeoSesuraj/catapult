from agents import Agent, Runner
from dotenv import load_dotenv

load_dotenv()

main_agent = Agent(name="Assistant", instructions="You are a helpful assistant")
flight_agent = Agent()
hotel_agent = Agent()
attraction_agent = Agent()

result = Runner.run_sync(main_agent, "Write a haiku about recursion in programming.")
print(result.final_output)
